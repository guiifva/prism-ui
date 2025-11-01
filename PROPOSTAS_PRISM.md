### Solução 1: Agendamentos Dinâmicos (Event-Driven)

**Descrição:** O sistema reage a cada evento de atualização de segmento do Kafka em tempo real. Se um CNPJ entra em um segmento, o Prism *imediatamente* verifica se há campanhas/jornadas associadas e agenda os disparos (ex: "enviar agora", "enviar em 2 dias"). Se o CNPJ *muda* de segmento, o Prism reavalia as jornadas e *cancela ativamente* os disparos futuros que não fazem mais sentido.

**Pontos Positivos:**

* **Alta Relevância (Visão de Jornada):** Este é o único modelo que permite "Jornadas" verdadeiras. Se o cliente é movido do segmento A para o B, o sistema *cancela* a comunicação de A (que ele não deve mais receber) e *inicia* a comunicação de B.
* **Comunicação Contextual:** O disparo está sempre sincronizado com o estado *mais atual* do cliente.
* **Flexibilidade de Regras:** Permite a criação de lógicas complexas, como "critérios de saída" (ex: "remover da jornada se o cliente comprar") ou "esperas" (ex: "enviar 24h após a entrada no segmento").
* **Performance Distribuída:** A carga de processamento é distribuída ao longo do dia, a cada evento do Kafka, em vez de um pico de processamento em lote.

**Pontos Negativos:**

* **Complexidade de Implementação (Muito Alta):** Esta é a solução mais complexa de construir. Requer:
    1.  **Lógica de Cancelamento:** Ao receber uma atualização, o `prism-ingestor` precisa consultar o "Config DB" (para regras), o "Audience DB" (para estado anterior) e a tabela `scheduled_dispatches` (para encontrar e *deletar* agendamentos futuros).
    2.  **Gerenciamento de Estado:** É preciso controlar "onde" o CNPJ está em cada jornada.
    3.  **Risco de Condição de Corrida:** O que acontece se o *disparador* tentar enviar um agendamento no exato momento em que o *ingestor* tenta cancelá-lo? Isso exige um controle de transação robusto ou "locking" (ex: `SELECT... FOR UPDATE`) na tabela de agendamentos.
* **Carga de Leitura no Banco:** Cada evento do Kafka (que pode ser de alto volume) gera múltiplas leituras e escritas nos bancos de dados (Audience, Config e `scheduled_dispatches`), aumentando o "trabalho" por mensagem.

---

### Solução 2: Agendamentos Fixos (Batch-Oriented)

**Descrição:** O sistema desacopla a ingestão de dados do agendamento de campanhas.
1.  **Ingestão (Contínua):** Os eventos do Kafka atualizam o "Audience DB" o dia todo. Esta é a única responsabilidade do ingestor.
2.  **Agendamento (Batch):** Um processo separado (ex: um CronJob rodando 1x por dia, às 5h da manhã) lê o "Audience DB", encontra todos os CNPJs elegíveis para campanhas *daquele dia* e popula a tabela `scheduled_dispatches` de uma só vez.
3.  **Disparo:** Os workers disparam o que está na fila.

Se um CNPJ muda de segmento às 10h da manhã, o "Audience DB" é atualizado, mas a fila de `scheduled_dispatches` (criada às 5h) não é alterada. A mudança de segmento só terá efeito no *próximo* ciclo de agendamento (às 5h da manhã do dia seguinte).

**Pontos Positivos:**

* **Simplicidade de Implementação:** Arquitetura muito mais simples e robusta. As responsabilidades são claramente separadas:
    * `Ingestor`: Apenas faz `UPSERT` no Audience DB (rápido e leve).
    * `Scheduler`: Faz a lógica de negócio pesada em um horário controlado.
    * `Dispatcher`: Apenas lê a fila e envia.
* **Previsibilidade:** Você sabe exatamente o que será disparado no dia, pois a "foto" da audiência foi tirada em um momento específico (às 5h).
* **Performance de Ingestão:** O tópico Kafka é consumido na velocidade máxima, pois o `ingestor` não tem lógica de negócio complexa.
* **Sem Condições de Corrida:** Não existe a complexidade de "cancelar" um agendamento, pois a fila, uma vez criada, é imutável para aquele dia.

**Pontos Negativos:**

* **NÃO É UMA JORNADA:** Esta solução **não atende** ao requisito de "Jornadas do Marketing Cloud". É um sistema de **Campanhas em Lote (Batch Campaigns)**.
* **Latência / Falta de Relevância:** Se um cliente muda de segmento, ele pode receber comunicações defasadas. (Ex: Recebe um cupom de "primeira compra" mesmo já tendo se tornado um "cliente VIP" horas antes).
* **Carga de Pico (Batch):** O processo de "Scheduler" (às 5h da manhã) pode ser extremamente pesado, precisando varrer milhões de CNPJs contra centenas de regras de campanha de uma só vez, podendo gerar um pico de carga no banco.

---

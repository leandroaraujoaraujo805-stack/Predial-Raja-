# PREDIAL RAJA — versão pronta para implantação

Esta versão funciona com servidor Node.js + banco SQLite e já permite uso real em uma rede/servidor único.

## Recursos
- Multi-condomínio
- Administrador Predial Raja
- Síndico, conselho, condômino e funcionário
- Cadastro de condomínios
- Cadastro e edição de dados do condomínio
- Mural
- Chat individual
- Chat em grupos de funcionários
- Documentos e fotos
- Solicitações com status
- 48 apartamentos podem ser cadastrados posteriormente
- Primeiro condomínio: Condomínio do Edifício D'orvilliers
- Síndico: Leandro Araújo
- Conselho: Sra. Lina, Dr. Carlos e Sra. Jane
- 4 porteiros 12x36 já representados como usuários iniciais
- PWA para instalação no celular após publicação em HTTPS

## Primeiro acesso
E-mail: admin@predialraja.local
Senha: 123456

Também existe:
E-mail: sindico@dorvilliers.local
Senha: 123456

Troque as senhas e configure JWT_SECRET antes de produção.

## Como executar no computador/servidor
1. Instale Node.js 20 ou superior.
2. Abra o terminal na pasta do projeto.
3. Execute:
   npm install
   npm start
4. Abra http://localhost:3000

Na rede local, outros aparelhos podem acessar pelo IP do computador, desde que firewall/rede permitam.

## Para internet/uso entre vários celulares
Publique esta pasta em um servidor Node.js com HTTPS. O banco SQLite fica em `server/data/predial_raja.db` e os arquivos em `server/data/uploads`.

Para uma implantação maior, migre o banco para PostgreSQL e o armazenamento de arquivos para S3 compatível.

## Segurança antes da publicação
- Defina variável JWT_SECRET forte.
- Troque todas as senhas iniciais.
- Use HTTPS.
- Faça backup periódico de `server/data`.
- Limite acesso administrativo.
- Configure política de privacidade/LGPD.


## Painel financeiro e indicadores
- Inadimplência automática por unidades
- Taxa de arrecadação
- Saldo mensal
- Crescimento ou queda da arrecadação versus mês anterior
- Evolução de receita prevista, recebida e despesas
- Gráfico automático por condomínio
- Histórico financeiro mensal

## Dashboard executivo
Foi adicionado um painel gerencial com:
- inadimplência atual e tendência
- arrecadação e comparação com mês anterior
- saldo mensal
- crescimento ou queda da receita recebida
- total de moradores e funcionários
- solicitações em aberto
- quantidade de comunicados
- gráfico de receitas x despesas
- gráfico mensal de inadimplência
- leitura automática com alertas de melhora, estabilidade ou piora

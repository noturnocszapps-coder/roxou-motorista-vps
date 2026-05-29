# Guia de Backup e Recuperação (ROXOU)
Este documento detalha o plano de recuperação de desastres (DRP) e procedimentos operacionais recomendados para manter a integridade operacional do sistema de reservas **reserva.roxou.com.br** em ambiente de produção (hospedado na VPS e integrado ao Supabase).

---

## 1. Backup do Banco de Dados (Supabase)

O Supabase gerencia o PostgreSQL físico, porém backups de segurança manuais e automáticos externos reduzem os riscos de perda em cenários catastróficos.

### 1.1 Backup Automático Remoto (Sugerido via GitHub Actions)
Você pode usar a ferramenta CLI oficial do Supabase programada via cronjob semanal ou diário para exportar o esquema e os dados atuais em um repositório privado.

### 1.2 Backups Manuais via Supabase CLI
A partir de sua máquina local conectada ao console do projeto:

1. **Instalar a CLI do Supabase:**
   ```bash
   npm i -g supabase
   ```
2. **Realizar o Login no Painel:**
   ```bash
   supabase login
   ```
3. **Gerar Snapshot do Banco de Dados (Estrutura + Dados):**
   ```bash
   # Exporta todo o esquema DDL atualizado
   supabase db pull --project-ref seu-id-do-projeto-supabase

   # Exporta os dados das tabelas para um arquivo SQL dump
   supabase db dump --project-ref seu-id-do-projeto-supabase --data-only -f backup_data_roxou.sql
   ```

### 1.3 Backup via Console Web (Supabase Dashboard)
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard).
2. Vá em **Project Settings** > **Database** > **Backups**.
3. O Supabase executa backups diários automatizados para planos Pro. Você pode baixar snapshots sob demanda clicando em "Download backup".

---

## 2. Backup da VPS (Servidor Linux Nginx)

Caso ocorra um travamento de hardware na VPS, todo o ambiente de front-end estático (index.html, JS compilados, CSS e Nginx) deve estar seguro para reimplantação imediata.

### 2.1 Backup da Configuração do Nginx
Sempre faça backup do arquivo do bloco de servidor do Nginx localizado em `/etc/nginx/sites-available` ou `/etc/nginx/conf.d`:
```bash
# Executado dentro da VPS para criar cópia compactada na pasta /backup do sistema
sudo mkdir -p /backups/nginx
sudo cp /etc/nginx/sites-available/reserva-roxou.conf /backups/nginx/reserva-roxou.conf.bak
```

### 2.2 Backup do Diretório de Produção (/var/www/reserva-roxou)
Compactação do código estático do build (dist):
```bash
sudo tar -czvf /backups/vps_assets_roxou_$(date +%F).tar.gz -C /var/www/reserva-roxou .
```

---

## 3. Recuperação de Sistema Completo (Disaster Recovery)

Se a VPS queimar ou o projeto Supabase for acidentalmente deletado, siga a ordem exata de procedimentos abaixo para restaurar o sistema 100% online em menos de 10 minutos.

### Passo A: Restaurar o Supabase
1. Crie um novo projeto no portal do Supabase.
2. Acesse a guia **SQL Editor** do projeto recém-criado.
3. Copie o conteúdo completo do arquivo `supabase/schema.sql` do código fonte do Roxou e cole no editor. Execute para criar a estrutura exata do banco de dados, RLS e Triggers integrados.
4. Se possuir um dump de dados anterior (`backup_data_roxou.sql`), execute via console ou CLI para recuperar o histórico:
   ```bash
   psql -h db.seu-novo-projeto.supabase.co -U postgres -d postgres -f backup_data_roxou.sql
   ```

### Passo B: Restaurar/Configurar nova VPS
1. Contrate ou inicie uma máquina limpa Linux (Ubuntu Server 20.04/22.04 LTS recomendado).
2. Atualize os pacotes do sistema:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
3. Instale o Nginx e git:
   ```bash
   sudo apt install nginx git curl -y
   ```
4. Baixe ou clone o repositório do projeto dentro de `/var/www/reserva-roxou`.

### Passo C: Atualização do `.env` de Produção
No servidor novo, configure o arquivo `.env` de produção com as novas credenciais geradas pelo seu novo projeto Supabase:
```env
VITE_SUPABASE_URL="https://seu-novo-id.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-nova-chave-publica-anonima-supabase"
```

### Passo D: Instalar Dependências e Compilar
1. Instale o Node.js v18/v20 LTS na VPS:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
2. Instale as dependências executando na raiz do projeto:
   ```bash
   npm install
   ```
3. Realize a compilação otimizada do bundle de produção do Vite:
   ```bash
   npm run build
   ```
   *Isso gerará os arquivos estáticos compilados e minificados no diretório `/var/www/reserva-roxou/dist`.*

### Passo E: Configuração das rotas Nginx e SSL
1. Copie as configurações sugeridas em `nginx.example.conf` para o arquivo do Nginx da VPS:
   ```bash
   sudo cp nginx.example.conf /etc/nginx/sites-available/reserva-roxou
   sudo ln -s /etc/nginx/sites-available/reserva-roxou /etc/nginx/sites-enabled/
   ```
2. Teste e reinicie o Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```
3. Instalar Certbot para gerar o certificado SSL Let's Encrypt de graça com renovação automática:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d reserva.roxou.com.br
   ```

Tudo pronto! Seu sistema estará completamente restaurado e rodando com criptografia SSL avançada no domínio real.

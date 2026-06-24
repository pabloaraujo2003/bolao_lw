# Bolão da Copa 2026

Site interno de bolão para a Copa do Mundo 2026. Resultados sincronizados automaticamente via API-Football.

## Setup

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **SQL Editor** e execute o conteúdo de `supabase/migrations/0001_init.sql`
3. Copie as chaves em **Project Settings → API**

### 2. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` — URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key pública
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (nunca expor no client)
- `RAPIDAPI_KEY` — Chave da [API-Football via RapidAPI](https://rapidapi.com/api-sports/api/api-football)
- `CRON_SECRET` — String aleatória para proteger o endpoint do cron

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### 4. Primeiro uso

1. Crie uma conta em `/cadastro`
2. Torne o usuário admin no Supabase SQL Editor:
   ```sql
   update public.profiles set is_admin = true where id = 'SEU_USER_ID';
   ```
3. Acesse `/admin/jogos` e clique em **Importar da API-Football**
4. Resultados são sincronizados automaticamente a cada 5 min (Vercel Cron)

### 5. Deploy (Vercel)

```bash
vercel deploy --prod
```

Configure as variáveis de ambiente no painel da Vercel antes do deploy.

## Pontuação

| Resultado | Pontos |
|-----------|--------|
| Placar exato | 3 |
| Acertou vencedor / empate | 1 |
| Errou | 0 |

Desempate: total de pontos → acertos exatos → acertos de resultado.

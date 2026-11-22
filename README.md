# Юки

Приватный дневник ухода за морской свинкой Юки: экран «Сегодня» с разбором от ИИ, питание со справочником продуктов, вес, уборка клетки, смена воды и отчёт для ветеринара.

## Стек
- **React + Vite** (как Astrelle), 3D-модель Юки на **@react-three/fiber** (Draco-сжатый GLB).
- **Supabase** (`qhuutftcfuldqziyhgbu`) — БД + Edge Functions (`app-auth`, `manage-users`, `ai-coach`; исходник `ai-coach` — в `supabase/functions/`).
- **GitHub Pages** → `yuki.barabashflow.pl` (CNAME).
- ИИ-разбор — edge-функция `ai-coach`: правила считают выводы по дневнику, модель **Barabash AI** только пересказывает их.

## Разработка
```bash
npm install
npm run icons   # сгенерировать PNG-иконки из public/favicon.svg
npm run dev      # /#gallery — галерея маскота и иконок (только в dev)
```

## Деплой
Пуш в `main` → GitHub Actions (`.github/workflows/deploy.yml`) собирает и публикует на Pages.
DNS: CNAME `yuki` → `<user>.github.io` в зоне barabashflow.pl.

## ИИ-советы (Barabash AI)
Функция `ai-coach` читает секреты из окружения Supabase Edge:
- `BARABASH_AI_KEY` — ключ `bai-sk-*` (обязателен для реальных советов),
- `BARABASH_AI_URL` — по умолчанию `https://barabash-ai.tailcd3444.ts.net/v1`,
- `BARABASH_AI_MODEL` — по умолчанию `qwen3.5:9b`.

Без ключа (или если ответ модели не прошёл проверку) функция отдаёт текст, собранный правилами.

Деплой функции: `SUPABASE_ACCESS_TOKEN=… npx supabase functions deploy ai-coach --project-ref qhuutftcfuldqziyhgbu --use-api`.

## Аккаунты
`Dmytrii` и `Stasia` (защищены, удалить нельзя). Остальных добавляют/удаляют в «Настройках».

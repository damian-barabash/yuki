# Юки 🐹

Приватный дневник ухода за морской свинкой Юки: уборка клетки, вес (с ИИ-советом) и кормёжка со справочником безопасных продуктов.

## Стек
- **React + Vite** (как Astrelle), 3D-модель Юки на **@react-three/fiber** (Draco-сжатый GLB).
- **Supabase** (`qhuutftcfuldqziyhgbu`) — БД + Edge Functions (`app-auth`, `manage-users`, `ai-weight-rec`).
- **GitHub Pages** → `yuki.barabashflow.pl` (CNAME).
- ИИ-советы по весу — через **Barabash AI** (Mac Studio) в edge-функции `ai-weight-rec`.

## Разработка
```bash
npm install
npm run icons   # сгенерировать PNG-иконки из public/favicon.svg
npm run dev
```

## Деплой
Пуш в `main` → GitHub Actions (`.github/workflows/deploy.yml`) собирает и публикует на Pages.
DNS: CNAME `yuki` → `<user>.github.io` в зоне barabashflow.pl.

## ИИ-советы (Barabash AI)
Функция `ai-weight-rec` читает секреты из окружения Supabase Edge:
- `BARABASH_AI_KEY` — ключ `bai-sk-*` (обязателен для реальных советов),
- `BARABASH_AI_URL` — по умолчанию `https://barabash-ai.tailcd3444.ts.net/v1`,
- `BARABASH_AI_MODEL` — по умолчанию `qwen3.5:9b`.

Без ключа функция отдаёт корректный эвристический совет по норме веса.

## Аккаунты
`Dmytrii` и `Stasia` (защищены, удалить нельзя). Остальных добавляют/удаляют в «Настройках».

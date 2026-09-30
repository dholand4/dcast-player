# dcast-player

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/styled--components-6.x-DB7093?style=for-the-badge&logo=styledcomponents&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Navigation-7.x-6B52AE?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-cloud_sync-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Cast-Chromecast-4285F4?style=for-the-badge&logo=googlecast&logoColor=white" />
  <img src="https://img.shields.io/badge/Android_TV-leanback-3DDC84?style=for-the-badge&logo=android&logoColor=white" />
  <img src="https://img.shields.io/badge/Jest-tests-C21325?style=for-the-badge&logo=jest&logoColor=white" />
</p>

> Player de IPTV e streaming com TV ao vivo, filmes e séries a partir de listas Xtream Codes e M3U. Tem perfis, favoritos, "Continuar Assistindo" sincronizado na nuvem e transmissão para Chromecast. Roda no Android, no iOS, na Android TV e na Web.

---

## Índice

- [Sobre](#sobre)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Como rodar](#como-rodar)
- [Web e proxy](#-web-e-proxy)
- [Banco de dados](#️-banco-de-dados)
- [Variáveis de ambiente](#️-variáveis-de-ambiente)
- [Scripts disponíveis](#-scripts-disponíveis)
- [Builds e atualizações OTA](#-builds-e-atualizações-ota)

---

## Sobre

O **DCast Player** conecta a um servidor IPTV (Xtream Codes ou lista M3U) e organiza o conteúdo em **TV ao vivo**, **filmes** e **séries**, com grade de programação, pôsteres e detalhes de cada título. Cada conta pode ter até 4 perfis, cada um com seu próprio histórico e seus favoritos. Pastas, itens ocultos e progresso ficam salvos no aparelho e são sincronizados no Supabase, então o que você faz no celular aparece na Web e na TV.

---

## ✨ Funcionalidades

**Contas e perfis**
- 🔐 Login por link M3U ou por Xtream Codes (servidor, usuário e senha), com botão de colar e mostrar senha
- 👥 Várias listas salvas, com troca rápida entre elas
- 🧑‍🤝‍🧑 Até 4 perfis por conta, com avatar e cor, sincronizados entre aparelhos
- 🧹 Ao trocar de lista, o cache da lista anterior é limpo para não misturar canais

**Home**
- 🏠 Fileiras de Continuar Assistindo, Favoritos e categorias em carrossel
- ⭐ Favoritar segurando o pôster
- 🆕 Botão **Novidades** com selo de contagem e painel de episódios novos das séries favoritas
- 🔎 Busca integrada em canais, filmes e séries

**TV ao vivo**
- 📺 Zapping com gaveta de canais dentro do player, sem sair da tela cheia
- 🗓️ Grade de programação (EPG) com selos **NO AR**, **A SEGUIR** e **ENCERRADO**, barra de progresso e rolagem até o programa atual
- ⏪ Replay de programas (catch-up) nos canais que oferecem arquivo
- 🧬 Canais repetidos com o mesmo ID no servidor aparecem uma vez só

**Filmes e séries**
- 🎬 Catálogo em grade com paginação e busca
- 🖼️ Tela de detalhes com pôster, nota, gênero, duração, direção, elenco, sinopse e trailer no YouTube
- 🍿 Séries por temporadas e episódios, com miniatura, duração e sinopse de cada um
- ✅ Marcar episódio ou filme como assistido
- ⏭️ Próximo episódio automático com contagem regressiva

**Player**
- ⏯️ Play/pause, avançar e voltar 10s (toque duplo no celular, duplo clique na Web)
- 🐢 Velocidade de `0.5x` a `2x`, faixas de áudio e legendas, proporção de tela (padrão, 16:9, 4:3, preencher)
- 🔒 Bloqueio de tela contra toques acidentais
- 😴 Timer para dormir: 15, 30, 45, 60 min ou ao fim do título
- 🪟 Picture-in-Picture no Android e na Web
- 🩺 Watchdog que detecta travamento e reconecta sozinho, com diagnóstico de rede

**Chromecast**
- 📡 Busca de dispositivos na rede Wi-Fi e controle da transmissão pelo app
- 🔁 Sessão ativa restaurada ao reabrir o app, sem reiniciar o vídeo na TV
- ⏭️ Troca de episódio na TV antes do fim, com aviso de próximo episódio
- ⚠️ Aviso quando a TV não reproduz o formato do vídeo (áudio 5.1 ou HEVC)

**Pastas e organização**
- 📁 Pastas personalizadas (ex.: *Canais Abertos*, *Meus Filmes*) com os itens que você escolher
- 👁️ Ocultar categorias e canais da lista e da gaveta de zapping
- ☁️ Pastas, ocultos, favoritos, perfis e progresso sincronizados no Supabase

**Android TV e tablets**
- 📺 Suporte nativo a Android TV (leanback), com banner próprio e navegação pelo controle remoto
- 📐 Layout responsivo para tablets

**Desempenho**
- ⚡ Pré-carregamento em fila: TV ao vivo assim que a Home abre, séries após 3s e filmes após 6s, sem estourar o limite de requisições do servidor (HTTP 429)
- 🚀 Pré-carregamento dos primeiros megabytes do filme para começar a tocar mais rápido
- 🧠 Cache em memória e em disco (MMKV criptografado no celular, `localStorage` na Web)
- 🧾 Listas com `@shopify/flash-list` no celular e `FlatList` ajustada na Web

---

## Arquitetura

```
┌─────────────────────────────────────────────┐
│     App (React Native + Expo + Web)         │
│  AuthStack                                  │
│   SetupScreen     → Login Xtream / M3U      │
│  ProfileStack                               │
│   ProfileScreen   → Escolha de perfil       │
│  AppStack                                   │
│   HomeScreen      → Home e Novidades        │
│   CategoryScreen  → Canais, filmes, séries  │
│   DetailsScreen   → Detalhes e episódios    │
│   PlayerScreen    → Player de vídeo         │
│   SearchScreen    → Busca                   │
└───────┬───────────────┬─────────────┬───────┘
        │ HTTP          │ REST        │ Google Cast
        │ (Web via      │ x-dcast-key │
        │  /api/proxy)  │             │
┌───────▼───────┐ ┌─────▼───────┐ ┌───▼───────────┐
│ Servidor IPTV │ │  Supabase   │ │  Chromecast   │
│ Xtream / M3U  │ │  5 tabelas  │ │  Smart TV     │
│ Live, VOD,    │ │  + RLS por  │ │               │
│ Séries, EPG   │ │  conta      │ │               │
└───────────────┘ └─────────────┘ └───────────────┘
```

### Estrutura de pastas

```
dcast-player/
├── api/
│   └── proxy.js                # proxy de streams para a versão Web (dev e VPS)
├── assets/                     # ícone, splash e banner da Android TV
├── plugins/
│   └── withAndroidTV.js        # config plugin: leanback, banner e manifest da TV
├── supabase/
│   └── migrations/             # SQL de RLS por conta e da tabela de perfis
├── web/
│   └── index.html              # HTML base da versão Web
└── src/
    ├── @types/                 # tipagens (Xtream, storage, styled)
    ├── assets/                 # imagens usadas no código
    ├── components/             # componentes globais (castModalGlobal, epgModalGlobal, etc.)
    ├── constants/              # tema de cores e tokens
    ├── hooks/                  # useAuth, useXtream, useCast, useFavorites, useProfiles, etc.
    ├── providers/              # Auth, Profile, Cast e Theme
    ├── routes/                 # AuthStack, ProfileStack, AppStack e navigationRef
    ├── services/               # Xtream, Supabase, storage, prefetch e diagnóstico de rede
    ├── utils/                  # formatadores, parser M3U, identidade da conta, novos episódios
    └── view/                   # telas (setupScreen, profileScreen, homeScreen, etc.)
```

---

## Tecnologias

### App
| Tecnologia | Uso |
|------------|-----|
| React Native 0.86 + Expo SDK 57 | Base do app Android, iOS, Android TV e Web (New Architecture) |
| React 19 + React Native Web | Interface e versão Web |
| TypeScript 5.9 | Tipagem estática |
| styled-components 6 | Estilização com tema de tokens |
| React Navigation 7 | Navegação (native stack + `navigationRef`) |
| expo-video + react-native-video | Reprodução de vídeo e PiP |
| react-native-google-cast | Transmissão para Chromecast |
| @shopify/flash-list | Listas virtualizadas no celular |
| react-native-mmkv + expo-secure-store | Armazenamento local criptografado |
| expo-image | Pôsteres com cache |
| expo-updates | Atualizações OTA pelo EAS Update |

### Nuvem e infraestrutura
| Tecnologia | Uso |
|------------|-----|
| Supabase (REST) | Sincronização de perfis, favoritos, progresso, pastas e ocultos |
| Row Level Security | Cada conta só enxerga as próprias linhas (chave SHA-256 no cabeçalho `x-dcast-key`) |
| Node.js (`api/proxy.js`) | Proxy de streams para a Web, com bloqueio de hosts internos (SSRF) |
| EAS Build / EAS Update | Builds nativos e publicação OTA |

### Testes
| Tecnologia | Uso |
|------------|-----|
| Jest + jest-expo | Execução dos testes |
| @testing-library/react-native | Testes de componentes e telas |
| react-test-renderer | Renderização nos testes |

---

## Como rodar

### Pré-requisitos

- Node.js 20+
- npm 10+
- Android Studio (emulador Android / Android TV) ou Xcode (simulador iOS)
- Uma lista IPTV (Xtream Codes ou M3U) para testar

> O app usa módulos nativos (Chromecast, MMKV, vídeo), então **não roda no Expo Go**. Use `npm run android` / `npm run ios` ou um build de desenvolvimento do EAS.

### Mobile

```bash
# Instalar dependências
npm install

# Iniciar o Metro Bundler
npm start

# Compilar e abrir no Android (emulador ou aparelho conectado)
npm run android

# Compilar e abrir no iOS
npm run ios
```

### Web

```bash
# Iniciar a versão Web
npm run web
```

A aplicação abre em `http://localhost:8081`.

---

## 🌐 Web e proxy

No navegador, os streams IPTV passam pelo `api/proxy.js`, que responde em `/api/proxy`. Ele evita bloqueios de CORS e conteúdo misto (HTTP dentro de HTTPS) e recusa URLs que apontem para a rede interna.

```bash
# Gerar o build estático na pasta dist (servido pela VPS)
npm run build:web
```

Na VPS, sirva a pasta `dist` e exponha o `api/proxy.js` em `/api/proxy`, configurando as variáveis da seção [Variáveis de ambiente](#️-variáveis-de-ambiente).

---

## 🗄️ Banco de dados

### Tabelas (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `dcast_profiles` | Perfis de cada conta (nome, cor, exclusão lógica) |
| `dcast_watch_progress` | Progresso de reprodução e histórico de assistidos |
| `dcast_favorites` | Favoritos de canais, filmes e séries |
| `dcast_custom_folders` | Pastas personalizadas e os itens de cada uma |
| `dcast_hidden_items` | Categorias e canais ocultos por tipo de conteúdo |

Todas as tabelas têm a coluna `user_key`, um hash SHA-256 de servidor + usuário + senha (ou do perfil). O app envia esse valor no cabeçalho `x-dcast-key` e a política `dcast_owner_only` só libera as linhas com o mesmo `user_key`. Sem o cabeçalho, nenhuma linha fica visível.

### Migrations

Rode no **SQL Editor** do Supabase, nesta ordem. As duas podem ser executadas de novo sem problema.

| Arquivo | O que faz |
|---------|-----------|
| `supabase/migrations/20260926000000_isolar_dados_por_conta.sql` | Cria a função `dcast_request_key()`, remove dados no formato antigo, adiciona `hidden_from_continue` e aplica a RLS por conta |
| `supabase/migrations/20260927000000_perfis.sql` | Cria a tabela `dcast_profiles` com a mesma RLS |

> A primeira migration assume que `dcast_watch_progress`, `dcast_favorites`, `dcast_custom_folders` e `dcast_hidden_items` já existem no projeto Supabase.

---

## ⚙️ Variáveis de ambiente

### App — `.env`

```env
# Projeto Supabase usado na sincronização
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
```

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `EXPO_PUBLIC_SUPABASE_URL` | ❌ | URL do projeto Supabase (padrão: projeto do DCast) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ❌ | Chave pública do Supabase (padrão: chave do DCast) |

### Proxy Web — VPS

```env
# Origens autorizadas, separadas por vírgula
PROXY_ALLOWED_ORIGINS=https://app.seudominio.com

# Só se o servidor IPTV estiver na rede interna da VPS
PROXY_ALLOW_PRIVATE_HOSTS=false
```

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `PROXY_ALLOWED_ORIGINS` | ✅ em produção | Origens que podem usar o proxy. Vazia, qualquer site consegue usar |
| `PROXY_ALLOW_PRIVATE_HOSTS` | ❌ | `true` libera hosts da rede interna (padrão: bloqueado) |

---

## 📋 Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o Metro Bundler |
| `npm run android` | Compila e abre no Android |
| `npm run ios` | Compila e abre no iOS |
| `npm run web` | Inicia a versão Web |
| `npm run build:web` | Gera o build estático da Web em `dist/` |
| `npm test` | Roda todos os testes |
| `npm run test:watch` | Roda os testes em modo observação |
| `npx tsc --noEmit` | Verifica os tipos TypeScript |

---

## 🚀 Builds e atualizações OTA

### Perfis do EAS Build (`eas.json`)

| Perfil | Saída | Canal |
|--------|-------|-------|
| `development` | Build de desenvolvimento (dev client) | — |
| `preview` | APK interno | `preview` |
| `production` | App Bundle (Play Store) | `production` |
| `production-apk` | APK interno | `production` |

```bash
# Gerar um APK de testes
npx eas-cli build --profile preview --platform android
```

### Atualizações OTA

A versão nativa do app (`runtimeVersion`) acompanha o campo `version` do `app.json`. Mudanças só em JavaScript podem ser publicadas sem novo build:

```bash
# Canal de testes
npx eas-cli update --channel preview --environment preview --message "descricao da atualizacao"

# Canal de produção
npx eas-cli update --channel production --environment production --message "descricao da atualizacao"
```

---

## 📄 Licença

Projeto privado para distribuição personalizada do **DCast Player**.

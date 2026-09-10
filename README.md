# 🎬 DCast Player

**DCast Player** é um player de streaming e IPTV moderno, ultrarrápido e de alto desempenho, desenvolvido para **Mobile (Android e iOS)** e **Web**. O projeto foi desenhado com foco em usabilidade cinematográfica, performance fluida a 60/120 fps, sincronização em nuvem e suporte a listas Xtream Codes e M3U.

---

## 🚀 Principais Funcionalidades

### 📺 1. TV Ao Vivo (Live TV)
- **Zapping Ágil de Canais**: Transição fluida entre canais com decodificação por hardware.
- **Grade Completa de Programação (EPG 24h a 48h)**:
  - Integração completa com o endpoint de programação IPTV com decodificação segura Base64.
  - Badges em tempo real: 🔴 **NO AR**, ⏳ **A SEGUIR** e ⏱️ **ENCERRADO**.
  - Barra de progresso dinâmica com a porcentagem de conclusão do programa atual.
  - Sinopses expansíveis com um toque.
  - Rolagem automática (*scroll to current*) para a atração ao vivo.
- **Gaveta de Canais no Player**: Navegue e troque de canal lateralmente sem interromper a transmissão em tela cheia.
- **Deduplicação Inteligente**: Canais espelhados que compartilham o mesmo ID no servidor IPTV são automaticamente deduplicados, evitando canais repetidos na listagem.

### 🎬 2. Filmes (VOD)
- **Catálogo Completo**: Navegação veloz em grade de 3 colunas, com paginação e busca instantânea.
- **Tela de Detalhes Cinematográfica**:
  - Pôsteres em alta resolução com cache em disco e memória.
  - Informações completas: nota TMDB (estrelas), gênero, duração, direção, elenco e sinopse.
  - Botão integrado para **assistir ao trailer oficial no YouTube**.
- **Smart Pre-fetch**: Pré-carregamento dos primeiros megabytes da mídia em segundo plano para início imediato da reprodução.
- **Continuar Assistindo**: Salva automaticamente a minutagem exata onde você parou.

### 🍿 3. Séries
- **Organização por Temporadas e Episódios**:
  - Navegação entre temporadas por pílulas (*Season Pills*).
  - Miniaturas individuais por episódio, duração e sinopse.
- **Higienização e Idempotência de Títulos**: Títulos sempre padronizados (`Série - T1E1: Título`), evitando duplicações sucessivas no histórico.
- **Próximo Episódio Automático**: Contagem regressiva no término do episódio para iniciar o próximo sem necessidade de voltar ao menu.

### ⚡ 4. Fila Inteligente de Pré-Carregamento (`catalogSyncService`)
- **Carregamento Sequencial em Segundo Plano**:
  - **Passo 1 (0s - Imediato)**: Pré-carrega canais e categorias de **TV Ao Vivo** assim que a Home abre. Entrar em TV Ao Vivo abre em **0.1s** com os jogos do dia já baixados.
  - **Passo 2 (3s)**: Pré-carrega o catálogo de **Séries**.
  - **Passo 3 (6s)**: Pré-carrega o catálogo de **Filmes**.
- **Zero Gargalos**: Elimina travamentos de rede ou bloqueios por excesso de requisições simultâneas (HTTP 429).
- **Abertura em "Todos os Conteúdos"**: Todas as seções iniciam exibindo o catálogo completo ("Todos os Canais", "Todos os Filmes", "Todas as Séries") em vez de ficarem presas na primeira categoria do servidor.

### 📁 5. Gerenciador de Pastas e Categorias Personalizadas
- **Minhas Pastas (Pastas Customizadas)**: Crie pastas exclusivas (ex: *"Canais Abertos"*, *"Meus Filmes"*) e selecione apenas os canais e conteúdos desejados com mapeamento 1-para-1 exato.
- **Ocultar Pastas da Lista**: Remova categorias indesejadas da lista IPTV (ex: Conteúdo Adulto, Canais Estrangeiros) com 1 toque no ícone de olho (👁️).
- **Ocultar Canais Redundantes**: Oculte canais repetidos ou que você não assiste da grade geral e da gaveta de zapping.
- **Design Ultra-Compacto**: Cabeçalho e abas em chips finos (~28px), liberando mais de 80% do espaço da tela para busca e listagem.

### ☁️ 6. Sincronização em Nuvem (Supabase)
- **Pastas e Itens Ocultos na Nuvem**: As tabelas `dcast_custom_folders` e `dcast_hidden_items` mantêm suas preferências sincronizadas em tempo real.
- **Multi-Plataforma**: Crie ou edite uma pasta no celular Android/iOS e ela reflete instantaneamente na Web e vice-versa.

### ⏯️ 7. Player de Vídeo Avançado
- **Controles Completos**:
  - Play, Pause, Avançar 10s e Retroceder 10s.
  - Seletor de Velocidade de Reprodução: `0.5x`, `0.75x`, `1x`, `1.25x`, `1.5x`, `2x`.
  - Seletor de Faixas de Áudio e Legendas embutidas na transmissão.
  - Ajuste de Proporção de Tela (*Aspect Ratio*): Padrão, 16:9, 4:3 e Preenchimento (Zoom).
  - Bloqueio de Tela (*Lock Screen*): Trava os controles contra toques acidentais.
  - **Sleep Timer (Timer para Dormir)**: Opções de `15`, `30`, `45`, `60 minutos` ou `Ao Término do Filme/Episódio`.

### 📡 8. Transmissão Google Cast (Chromecast & Smart TVs)
- **Modal Dark Customizado**: Busca dispositivos na rede Wi-Fi com indicador visual de radar.
- **Controle Remoto de Transmissão**: Alterne canais, pause e desfaça a conexão diretamente do app.

### 👥 9. Múltiplas Contas Salvas (Trocar / Sair da Lista)
- **Suporte Multi-Listas**: Conecte diferentes servidores Xtream Codes e alterne entre eles na tela inicial (`SetupScreen`) com apenas 2 toques.
- **Limpeza Segura de Cache**: Alternar de conta limpa automaticamente os dados da lista anterior para evitar misturar canais.

### 🚀 10. Performance Extrema & Arquitetura Híbrida
- **Mobile com FlashList**: Utiliza `@shopify/flash-list` com `drawDistance={2500}` e altura determinística, eliminando telas pretas e garantindo rolagem a 60/120fps.
- **Web Otimizado**: Utiliza `FlatList` com `windowSize` ajustado no navegador para rolagem suave com a roda do mouse e trackpad.
- **Cache em 2 Níveis**: Cache em RAM instantâneo e persistência local via **MMKV** (Mobile) e **localStorage** (Web).

---

## 🛠️ Tecnologias Utilizadas

- **Core**: React Native 0.86, React 19, Expo SDK 57 (New Architecture habilitada).
- **Linguagem**: TypeScript 5.9 (tipagem estrita).
- **Estilização**: Styled Components (Native & Web).
- **Navegação**: React Navigation v7 (Native Stack com `navigationRef` resiliente).
- **Reprodução de Vídeo**: `expo-video` e `react-native-video`.
- **Transmissão**: `react-native-google-cast`.
- **Banco de Dados & Nuvem**: Supabase (`@supabase/supabase-js`).
- **Armazenamento Local**: `react-native-mmkv` (Mobile) e `localStorage` (Web).
- **Listas Virtuais**: `@shopify/flash-list` (Mobile) e `FlatList` nativo (Web).
- **Ícones & Mídia**: `@expo/vector-icons`, `expo-image`.
- **Testes**: Jest, `@testing-library/react-native`, `react-test-renderer` (192 testes automatizados).

---

## 📁 Estrutura do Projeto

```
dcast-player/
├── assets/                    # Ícones, splash screen e imagens
├── src/
│   ├── @types/                # Definições de tipagem TypeScript (Xtream, Storage, etc.)
│   ├── components/            # Componentes reutilizáveis globais
│   │   ├── badgeGlobal/
│   │   ├── buttonGlobal/
│   │   ├── cardGlobal/
│   │   ├── castButtonGlobal/
│   │   ├── castModalGlobal/
│   │   ├── categoryDrawerGlobal/
│   │   ├── categoryManagerModalGlobal/
│   │   ├── channelCardGlobal/
│   │   ├── confirmModalGlobal/
│   │   ├── customFolderEditModalGlobal/
│   │   ├── epgModalGlobal/
│   │   ├── headerGlobal/
│   │   ├── mainNavCardsGlobal/
│   │   ├── miniPlayerGlobal/
│   │   ├── posterCardGlobal/
│   │   └── ...
│   ├── hooks/                 # Hooks customizados (useAuth, useXtream, useCategoryManager, etc.)
│   ├── routes/                # Configuração do React Navigation e navigationRef
│   ├── services/              # Serviços de rede, storage, Xtream e Supabase
│   │   ├── catalogSyncService.ts  # Fila de pré-carregamento sequencial
│   │   ├── prefetchService.ts     # Pre-fetch dos primeiros megabytes do VOD
│   │   ├── storageService.ts      # MMKV storage (Mobile)
│   │   ├── storageService.web.ts  # localStorage (Web)
│   │   ├── supabaseService.ts     # Integração com banco Supabase
│   │   └── xtreamService.ts       # API Xtream Codes (Live, VOD, Séries, EPG)
│   ├── styles/                # Tema dark e tokens de design
│   ├── utils/                 # Formatadores, cálculos e higienizadores de título
│   └── view/                  # Telas da aplicação
│       ├── categoryScreen/    # Listagem de canais, filmes e séries
│       ├── detailsScreen/     # Detalhes de filmes e séries
│       ├── homeScreen/        # Tela inicial do app
│       ├── playerScreen/      # Player de vídeo avançado
│       ├── searchScreen/      # Busca integrada
│       └── setupScreen/       # Conexão e troca de listas IPTV
├── app.json                   # Configurações do Expo e EAS Update
├── package.json               # Dependências e scripts
└── vercel.json                # Configuração de build e rotas para Web (Vercel)
```

---

## 🗄️ Esquema do Banco de Dados (Supabase SQL)

Para habilitar a sincronização em nuvem de pastas customizadas e itens ocultos, execute o seguinte SQL no **SQL Editor** do Supabase:

```sql
-- 1. Tabela de Pastas Personalizadas
CREATE TABLE IF NOT EXISTS dcast_custom_folders (
  id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'live', 'movie', 'series'
  stream_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_folders_account 
  ON dcast_custom_folders (account_id, type);

-- 2. Tabela de Itens Ocultos (Categorias e Canais)
CREATE TABLE IF NOT EXISTS dcast_hidden_items (
  account_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'live', 'movie', 'series'
  hidden_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  hidden_streams JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (account_id, type)
);

CREATE INDEX IF NOT EXISTS idx_hidden_items_account 
  ON dcast_hidden_items (account_id, type);

-- 3. Habilitar RLS (Row Level Security) permissivo para leitura e escrita
ALTER TABLE dcast_custom_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dcast_hidden_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write on dcast_custom_folders" 
  ON dcast_custom_folders FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read/write on dcast_hidden_items" 
  ON dcast_hidden_items FOR ALL USING (true) WITH CHECK (true);
```

---

## 💻 Comandos e Scripts

### Instalação de Dependências
```bash
npm install
```

### Executar Localmente
```bash
# Iniciar o Metro Bundler
npm start

# Executar no Android (Emulador ou Dispositivo Conectado)
npm run android

# Executar no Navegador Web
npm run web
```

### Testes Automatizados
```bash
# Executar todas as 41 suítes de testes (192 testes)
npm test

# Modo de observação (Watch Mode)
npm run test:watch
```

### Verificação de Tipos TypeScript
```bash
npx tsc --noEmit
```

### Build e Exportação Web
```bash
# Gera o build estático otimizado na pasta 'dist' (utilizado pela Vercel)
npm run build:web
```

### Publicação de Atualizações OTA (Over-The-Air)
```bash
# Canal de Produção (disponibiliza imediatamente para os usuários do APK/iOS)
npx eas-cli update --channel production --environment production --message "descricao da atualizacao"

# Canal de Testes / Preview
npx eas-cli update --channel preview --environment preview --message "descricao da atualizacao"
```

---

## 📄 Licença

Este projeto é de propriedade privada para distribuição personalizada do **DCast Player**.

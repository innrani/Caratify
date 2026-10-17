
# 🎵 Caratify - SEVENTEEN Spotify Stats

Um aplicativo web que mostra suas estatísticas do Spotify focado no grupo SEVENTEEN! Descubra qual é o seu nível de Carat baseado no quanto você escuta SEVENTEEN.

## ✨ Funcionalidades

- 🎯 **Análise Focada no SEVENTEEN**: Filtra automaticamente suas músicas e dados para mostrar apenas conteúdo do SEVENTEEN
- 📊 **Estatísticas Personalizadas**: 
  - Top tracks do SEVENTEEN
  - Tempo total de escuta estimado
  - Nível Carat baseado no seu consumo
  - Informações sobre artistas favoritos
  - Estatísticas das units BSS, JxW, HxW, CxM, Hip-Hop Team, Vocal Team, Performance Team e Leaders quando identificadas nos créditos do Spotify
- 🔐 **Autenticação Segura**: Integração oficial com a API do Spotify usando OAuth 2.0
- 🎨 **Design Moderno**: Interface inspirada no Spotify com tema dark

## 🛠️ Configuração

### 1. Pré-requisitos

- Node.js (versão 16 ou superior)
- Uma conta no Spotify Developer Dashboard

### 2. Configuração do Spotify App

1. Acesse [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Clique em "Create an App"
3. Preencha os dados do seu app
4. Em "Redirect URIs", adicione `http://127.0.0.1:3000` para desenvolvimento e `https://innrani.github.io/Caratify/` para produção.
5. Salve e copie o **Client ID**. O projeto usa Authorization Code com PKCE no navegador e não precisa do Client Secret.

### 3. Configuração do Projeto

1. Clone o repositório:
```bash
git clone [URL_DO_SEU_REPO]
cd Caratify
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com o Client ID do seu app
VITE_SPOTIFY_CLIENT_ID=seu_client_id_aqui
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000
```

### 4. Executar o Projeto

```bash
npm run dev
```

O projeto estará disponível em `http://127.0.0.1:3000`

## 🔒 Segurança

- ✅ Client Secret configurado via variáveis de ambiente
- ✅ `.env` incluído no `.gitignore`
- ✅ Tokens armazenados localmente no browser
- ✅ Autenticação oficial via OAuth 2.0

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── Dashboard.tsx       # Componente principal do dashboard
│   └── ui/                # Componentes de UI (shadcn/ui)
├── lib/
│   └── spotify.js         # Funções da API do Spotify
├── styles/
│   └── globals.css        # Estilos globais
├── App.tsx                # Componente principal
└── main.tsx              # Ponto de entrada
```

## 🚀 Tecnologias

- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes
- **Lucide React** para ícones
- **Spotify Web API** para dados

## 📝 Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

**Nota**: Este é um projeto não-oficial e não tem afiliação com o SEVENTEEN ou PLEDIS Entertainment.  

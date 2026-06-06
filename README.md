# Venda Consignada - Controle de Estoque

Projeto full stack para cadastro de estoque com API Java Spring Boot, MongoDB e frontend React.

## Colecoes MongoDB

- `categoria`
- `produto`
- `produto-no-estoque`
- `kit-pre-montado`

## Rodando localmente

Configure a conexao com MongoDB por variavel de ambiente quando precisar usar usuario e senha. Nao coloque credenciais reais em `application.yml`.

Exemplo:

```bash
export MONGODB_URI="mongodb+srv://usuario:senha@cluster/exemplo"
```

No Windows PowerShell:

```powershell
$env:MONGODB_URI="mongodb+srv://usuario:senha@cluster/exemplo"
```

Suba o MongoDB:

```bash
docker compose up -d
```

Rode a API:

```bash
cd backend
./gradlew bootRun
```

No Windows PowerShell:

```powershell
cd backend
.\gradlew.bat bootRun
```

Rode o frontend:

```bash
cd frontend
npm install
npm run dev
```

URLs padrao:

- API: `http://localhost:8080/api`
- Frontend: `http://localhost:5173`

## Endpoints

Categorias:

- `GET /api/categorias`
- `GET /api/categorias/{codigo}`
- `POST /api/categorias`
- `PUT /api/categorias/{codigo}`
- `DELETE /api/categorias/{codigo}`

Produtos:

- `GET /api/produtos`
- `GET /api/produtos/{codigo}`
- `POST /api/produtos`
- `PUT /api/produtos/{codigo}`
- `DELETE /api/produtos/{codigo}`

Estoque:

- `GET /api/estoque`
- `GET /api/estoque/{codigoDoProduto}`
- `POST /api/estoque`
- `PUT /api/estoque/{codigoDoProduto}`
- `DELETE /api/estoque/{codigoDoProduto}`

Kits pre montados:

- `GET /api/kits-pre-montados`
- `GET /api/kits-pre-montados/{codigo}`
- `POST /api/kits-pre-montados`
- `PUT /api/kits-pre-montados/{codigo}`
- `DELETE /api/kits-pre-montados/{codigo}`

## Exemplos de JSON

Categoria:

```json
{
  "codigo": "MODA-INTIMA",
  "nome": "Moda Intima"
}
```

Produto:

```json
{
  "codigo": "PROD-001",
  "nome": "Calcinha Preta",
  "imagem": "https://exemplo.com/produto.jpg",
  "fabricacao": "2026-06-01",
  "categoria": "MODA-INTIMA",
  "cores": ["preto", "branco"],
  "valor": 29.9
}
```

Produto no estoque:

```json
{
  "codigoDoProduto": "PROD-001",
  "quantidade": 50
}
```

Kit pre montado:

```json
{
  "codigo": "KIT-001",
  "produtos": ["PROD-001", "PROD-002"]
}
```

import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Boxes, Layers3, PackagePlus, Save, Tags, Trash2 } from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

const tabs = [
  { key: 'categorias', label: 'Categorias', icon: Tags },
  { key: 'produtos', label: 'Produtos', icon: PackagePlus },
  { key: 'estoque', label: 'Estoque', icon: Boxes },
  { key: 'kits', label: 'Kits', icon: Layers3 },
];

const emptyCategoria = { codigo: '', nome: '' };
const emptyProduto = {
  codigo: '',
  nome: '',
  imagem: '',
  fabricacao: '',
  categoria: '',
  cores: '',
  valor: '',
};
const emptyEstoque = { codigoDoProduto: '', quantidade: 0 };
const emptyKit = { codigo: '', produtos: '' };

function splitValues(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });

  if (!response.ok) {
    let message = 'Nao foi possivel concluir a operacao.';
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      message = await response.text();
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function App() {
  const [activeTab, setActiveTab] = useState('categorias');
  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [kits, setKits] = useState([]);
  const [categoriaForm, setCategoriaForm] = useState(emptyCategoria);
  const [produtoForm, setProdutoForm] = useState(emptyProduto);
  const [estoqueForm, setEstoqueForm] = useState(emptyEstoque);
  const [kitForm, setKitForm] = useState(emptyKit);
  const [status, setStatus] = useState({ type: 'idle', text: 'Conectando com a API em localhost:8080' });

  const produtoMap = useMemo(
    () => new Map(produtos.map((produto) => [produto.codigo, produto])),
    [produtos],
  );

  async function loadData() {
    const [categoriasData, produtosData, estoqueData, kitsData] = await Promise.all([
      request('/categorias'),
      request('/produtos'),
      request('/estoque'),
      request('/kits-pre-montados'),
    ]);
    setCategorias(categoriasData);
    setProdutos(produtosData);
    setEstoque(estoqueData);
    setKits(kitsData);
    setStatus({ type: 'success', text: 'Dados carregados.' });
  }

  useEffect(() => {
    loadData().catch((error) => setStatus({ type: 'error', text: error.message }));
  }, []);

  async function submitCategoria(event) {
    event.preventDefault();
    await request('/categorias', { method: 'POST', body: JSON.stringify(categoriaForm) });
    setCategoriaForm(emptyCategoria);
    await loadData();
    setStatus({ type: 'success', text: 'Categoria cadastrada.' });
  }

  async function submitProduto(event) {
    event.preventDefault();
    const payload = {
      ...produtoForm,
      cores: splitValues(produtoForm.cores),
      valor: Number(produtoForm.valor),
    };
    await request('/produtos', { method: 'POST', body: JSON.stringify(payload) });
    setProdutoForm(emptyProduto);
    await loadData();
    setStatus({ type: 'success', text: 'Produto cadastrado.' });
  }

  async function submitEstoque(event) {
    event.preventDefault();
    const payload = { ...estoqueForm, quantidade: Number(estoqueForm.quantidade) };
    await request('/estoque', { method: 'POST', body: JSON.stringify(payload) });
    setEstoqueForm(emptyEstoque);
    await loadData();
    setStatus({ type: 'success', text: 'Produto incluido no estoque.' });
  }

  async function submitKit(event) {
    event.preventDefault();
    const payload = { codigo: kitForm.codigo, produtos: splitValues(kitForm.produtos) };
    await request('/kits-pre-montados', { method: 'POST', body: JSON.stringify(payload) });
    setKitForm(emptyKit);
    await loadData();
    setStatus({ type: 'success', text: 'Kit pre montado cadastrado.' });
  }

  async function remove(path, message) {
    await request(path, { method: 'DELETE' });
    await loadData();
    setStatus({ type: 'success', text: message });
  }

  function run(action) {
    setStatus({ type: 'idle', text: 'Salvando...' });
    action().catch((error) => setStatus({ type: 'error', text: error.message }));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Boxes aria-hidden="true" />
          <div>
            <strong>Venda Consignada</strong>
            <span>Controle de Estoque</span>
          </div>
        </div>

        <nav className="tab-list" aria-label="Cadastros">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                className={activeTab === tab.key ? 'active' : ''}
                onClick={() => setActiveTab(tab.key)}
                type="button"
                title={tab.label}
              >
                <Icon aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <p className={`status ${status.type}`}>{status.text}</p>
      </aside>

      <section className="workspace">
        {activeTab === 'categorias' && (
          <CadastroSection title="Cadastro de categorias">
            <form onSubmit={(event) => run(() => submitCategoria(event))} className="form-grid">
              <Field label="Codigo" value={categoriaForm.codigo} onChange={(codigo) => setCategoriaForm({ ...categoriaForm, codigo })} required />
              <Field label="Nome" value={categoriaForm.nome} onChange={(nome) => setCategoriaForm({ ...categoriaForm, nome })} required />
              <SubmitButton />
            </form>
            <DataTable
              columns={['Codigo', 'Nome', '']}
              rows={categorias.map((categoria) => [
                categoria.codigo,
                categoria.nome,
                <IconButton key="del" label="Excluir" onClick={() => run(() => remove(`/categorias/${categoria.codigo}`, 'Categoria excluida.'))} />,
              ])}
            />
          </CadastroSection>
        )}

        {activeTab === 'produtos' && (
          <CadastroSection title="Cadastro de produtos na base">
            <form onSubmit={(event) => run(() => submitProduto(event))} className="form-grid wide">
              <Field label="Codigo" value={produtoForm.codigo} onChange={(codigo) => setProdutoForm({ ...produtoForm, codigo })} required />
              <Field label="Nome" value={produtoForm.nome} onChange={(nome) => setProdutoForm({ ...produtoForm, nome })} required />
              <Field label="Imagem URL" value={produtoForm.imagem} onChange={(imagem) => setProdutoForm({ ...produtoForm, imagem })} />
              <Field label="Fabricacao" type="date" value={produtoForm.fabricacao} onChange={(fabricacao) => setProdutoForm({ ...produtoForm, fabricacao })} required />
              <label className="field">
                <span>Categoria</span>
                <select value={produtoForm.categoria} onChange={(event) => setProdutoForm({ ...produtoForm, categoria: event.target.value })} required>
                  <option value="">Selecione</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.codigo} value={categoria.codigo}>{categoria.nome}</option>
                  ))}
                </select>
              </label>
              <Field label="Cores" value={produtoForm.cores} onChange={(cores) => setProdutoForm({ ...produtoForm, cores })} placeholder="preto, branco, azul" />
              <Field label="Valor" type="number" step="0.01" value={produtoForm.valor} onChange={(valor) => setProdutoForm({ ...produtoForm, valor })} required />
              <SubmitButton />
            </form>
            <DataTable
              columns={['Codigo', 'Nome', 'Categoria', 'Valor', '']}
              rows={produtos.map((produto) => [
                produto.codigo,
                produto.nome,
                produto.categoria,
                Number(produto.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                <IconButton key="del" label="Excluir" onClick={() => run(() => remove(`/produtos/${produto.codigo}`, 'Produto excluido.'))} />,
              ])}
            />
          </CadastroSection>
        )}

        {activeTab === 'estoque' && (
          <CadastroSection title="Cadastro de produtos no estoque">
            <form onSubmit={(event) => run(() => submitEstoque(event))} className="form-grid">
              <label className="field">
                <span>Produto</span>
                <select value={estoqueForm.codigoDoProduto} onChange={(event) => setEstoqueForm({ ...estoqueForm, codigoDoProduto: event.target.value })} required>
                  <option value="">Selecione</option>
                  {produtos.map((produto) => (
                    <option key={produto.codigo} value={produto.codigo}>{produto.codigo} - {produto.nome}</option>
                  ))}
                </select>
              </label>
              <Field label="Quantidade" type="number" min="0" value={estoqueForm.quantidade} onChange={(quantidade) => setEstoqueForm({ ...estoqueForm, quantidade })} required />
              <SubmitButton />
            </form>
            <DataTable
              columns={['Produto', 'Nome', 'Quantidade', '']}
              rows={estoque.map((item) => [
                item.codigoDoProduto,
                produtoMap.get(item.codigoDoProduto)?.nome ?? '-',
                item.quantidade,
                <IconButton key="del" label="Excluir" onClick={() => run(() => remove(`/estoque/${item.codigoDoProduto}`, 'Item de estoque excluido.'))} />,
              ])}
            />
          </CadastroSection>
        )}

        {activeTab === 'kits' && (
          <CadastroSection title="Cadastro de kit pre montado">
            <form onSubmit={(event) => run(() => submitKit(event))} className="form-grid">
              <Field label="Codigo" value={kitForm.codigo} onChange={(codigo) => setKitForm({ ...kitForm, codigo })} required />
              <Field label="Produtos" value={kitForm.produtos} onChange={(produtosValue) => setKitForm({ ...kitForm, produtos: produtosValue })} placeholder="PROD-001, PROD-002" required />
              <SubmitButton />
            </form>
            <DataTable
              columns={['Codigo', 'Produtos', '']}
              rows={kits.map((kit) => [
                kit.codigo,
                kit.produtos.join(', '),
                <IconButton key="del" label="Excluir" onClick={() => run(() => remove(`/kits-pre-montados/${kit.codigo}`, 'Kit excluido.'))} />,
              ])}
            />
          </CadastroSection>
        )}
      </section>
    </main>
  );
}

function CadastroSection({ title, children }) {
  return (
    <div className="cadastro-section">
      <header>
        <h1>{title}</h1>
      </header>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} {...props} />
    </label>
  );
}

function SubmitButton() {
  return (
    <button className="submit-button" type="submit">
      <Save aria-hidden="true" />
      <span>Cadastrar</span>
    </button>
  );
}

function IconButton({ label, onClick }) {
  return (
    <button className="icon-button" type="button" title={label} aria-label={label} onClick={onClick}>
      <Trash2 aria-hidden="true" />
    </button>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>Nenhum registro cadastrado.</td>
            </tr>
          ) : rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

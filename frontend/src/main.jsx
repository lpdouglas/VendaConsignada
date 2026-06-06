import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Boxes, Edit3, Eye, Layers3, PackagePlus, Save, Tags, Trash2, X } from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
const API_BASE_URL = API_URL.replace(/\/api\/?$/, '');

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
  imagemFile: null,
};
const emptyEstoque = { codigoDoProduto: '', quantidade: 0 };
const emptyKit = { codigo: '', produtos: '' };
const emptyFiltroProduto = { codigo: '', nome: '', categoria: '', valorMin: '', valorMax: '' };

function splitValues(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function imageUrl(path) {
  if (!path) {
    return '';
  }
  if (path.startsWith('http')) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    headers: isFormData ? options.headers : { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
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
  const [editing, setEditing] = useState({ categoria: null, produto: null, estoque: null, kit: null });
  const [filtroProduto, setFiltroProduto] = useState(emptyFiltroProduto);
  const [produtoVisualizado, setProdutoVisualizado] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', text: 'Conectando com a API em localhost:8080' });

  const produtoMap = useMemo(
    () => new Map(produtos.map((produto) => [produto.codigo, produto])),
    [produtos],
  );

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const valor = Number(produto.valor);
      const codigoOk = produto.codigo.toLowerCase().includes(filtroProduto.codigo.toLowerCase());
      const nomeOk = produto.nome.toLowerCase().includes(filtroProduto.nome.toLowerCase());
      const categoriaOk = !filtroProduto.categoria || produto.categoria === filtroProduto.categoria;
      const minOk = filtroProduto.valorMin === '' || valor >= Number(filtroProduto.valorMin);
      const maxOk = filtroProduto.valorMax === '' || valor <= Number(filtroProduto.valorMax);
      return codigoOk && nomeOk && categoriaOk && minOk && maxOk;
    });
  }, [produtos, filtroProduto]);

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

  async function uploadProdutoImagem(codigo, arquivo) {
    if (!arquivo) {
      return;
    }
    const formData = new FormData();
    formData.append('imagem', arquivo);
    await request(`/produtos/${codigo}/imagem`, { method: 'POST', body: formData });
  }

  async function submitCategoria(event) {
    event.preventDefault();
    const method = editing.categoria ? 'PUT' : 'POST';
    const path = editing.categoria ? `/categorias/${editing.categoria}` : '/categorias';
    await request(path, { method, body: JSON.stringify(categoriaForm) });
    setCategoriaForm(emptyCategoria);
    setEditing({ ...editing, categoria: null });
    await loadData();
    setStatus({ type: 'success', text: editing.categoria ? 'Categoria atualizada.' : 'Categoria cadastrada.' });
  }

  async function submitProduto(event) {
    event.preventDefault();
    const payload = {
      codigo: produtoForm.codigo,
      nome: produtoForm.nome,
      imagem: produtoForm.imagem,
      fabricacao: produtoForm.fabricacao,
      categoria: produtoForm.categoria,
      cores: splitValues(produtoForm.cores),
      valor: Number(produtoForm.valor),
    };
    const method = editing.produto ? 'PUT' : 'POST';
    const path = editing.produto ? `/produtos/${editing.produto}` : '/produtos';
    const produtoSalvo = await request(path, { method, body: JSON.stringify(payload) });
    await uploadProdutoImagem(produtoSalvo.codigo, produtoForm.imagemFile);
    setProdutoForm(emptyProduto);
    setEditing({ ...editing, produto: null });
    await loadData();
    setStatus({ type: 'success', text: editing.produto ? 'Produto atualizado.' : 'Produto cadastrado.' });
  }

  async function submitEstoque(event) {
    event.preventDefault();
    const payload = { ...estoqueForm, quantidade: Number(estoqueForm.quantidade) };
    const method = editing.estoque ? 'PUT' : 'POST';
    const path = editing.estoque ? `/estoque/${editing.estoque}` : '/estoque';
    await request(path, { method, body: JSON.stringify(payload) });
    setEstoqueForm(emptyEstoque);
    setEditing({ ...editing, estoque: null });
    await loadData();
    setStatus({ type: 'success', text: editing.estoque ? 'Estoque atualizado.' : 'Produto incluido no estoque.' });
  }

  async function submitKit(event) {
    event.preventDefault();
    const payload = { codigo: kitForm.codigo, produtos: splitValues(kitForm.produtos) };
    const method = editing.kit ? 'PUT' : 'POST';
    const path = editing.kit ? `/kits-pre-montados/${editing.kit}` : '/kits-pre-montados';
    await request(path, { method, body: JSON.stringify(payload) });
    setKitForm(emptyKit);
    setEditing({ ...editing, kit: null });
    await loadData();
    setStatus({ type: 'success', text: editing.kit ? 'Kit atualizado.' : 'Kit pre montado cadastrado.' });
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

  function editCategoria(categoria) {
    setCategoriaForm({ codigo: categoria.codigo, nome: categoria.nome });
    setEditing({ ...editing, categoria: categoria.codigo });
  }

  function editProduto(produto) {
    setProdutoForm({
      codigo: produto.codigo,
      nome: produto.nome,
      imagem: produto.imagem ?? '',
      fabricacao: produto.fabricacao ?? '',
      categoria: produto.categoria,
      cores: (produto.cores ?? []).join(', '),
      valor: produto.valor,
      imagemFile: null,
    });
    setEditing({ ...editing, produto: produto.codigo });
  }

  function editEstoque(item) {
    setEstoqueForm({ codigoDoProduto: item.codigoDoProduto, quantidade: item.quantidade });
    setEditing({ ...editing, estoque: item.codigoDoProduto });
  }

  function editKit(kit) {
    setKitForm({ codigo: kit.codigo, produtos: kit.produtos.join(', ') });
    setEditing({ ...editing, kit: kit.codigo });
  }

  function cancelEdit(type) {
    setEditing({ ...editing, [type]: null });
    if (type === 'categoria') setCategoriaForm(emptyCategoria);
    if (type === 'produto') setProdutoForm(emptyProduto);
    if (type === 'estoque') setEstoqueForm(emptyEstoque);
    if (type === 'kit') setKitForm(emptyKit);
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
              <Field label="Codigo" value={categoriaForm.codigo} onChange={(codigo) => setCategoriaForm({ ...categoriaForm, codigo })} required disabled={Boolean(editing.categoria)} />
              <Field label="Nome" value={categoriaForm.nome} onChange={(nome) => setCategoriaForm({ ...categoriaForm, nome })} required />
              <FormActions editing={Boolean(editing.categoria)} onCancel={() => cancelEdit('categoria')} />
            </form>
            <DataTable
              columns={['Codigo', 'Nome', 'Acoes']}
              rows={categorias.map((categoria) => [
                categoria.codigo,
                categoria.nome,
                <ActionGroup key="actions">
                  <IconButton icon={Edit3} label="Editar" onClick={() => editCategoria(categoria)} />
                  <IconButton icon={Trash2} label="Excluir" tone="danger" onClick={() => run(() => remove(`/categorias/${categoria.codigo}`, 'Categoria excluida.'))} />
                </ActionGroup>,
              ])}
            />
          </CadastroSection>
        )}

        {activeTab === 'produtos' && (
          <CadastroSection title="Cadastro de produtos na base">
            <form onSubmit={(event) => run(() => submitProduto(event))} className="form-grid wide">
              <Field label="Codigo" value={produtoForm.codigo} onChange={(codigo) => setProdutoForm({ ...produtoForm, codigo })} required disabled={Boolean(editing.produto)} />
              <Field label="Nome" value={produtoForm.nome} onChange={(nome) => setProdutoForm({ ...produtoForm, nome })} required />
              <label className="field">
                <span>Imagem local</span>
                <input type="file" accept="image/*" onChange={(event) => setProdutoForm({ ...produtoForm, imagemFile: event.target.files?.[0] ?? null })} />
              </label>
              <Field label="Fabricacao" type="date" value={produtoForm.fabricacao} onChange={(fabricacao) => setProdutoForm({ ...produtoForm, fabricacao })} required />
              <SelectCategoria value={produtoForm.categoria} onChange={(categoria) => setProdutoForm({ ...produtoForm, categoria })} categorias={categorias} required />
              <Field label="Cores" value={produtoForm.cores} onChange={(cores) => setProdutoForm({ ...produtoForm, cores })} placeholder="preto, branco, azul" />
              <Field label="Valor" type="number" step="0.01" value={produtoForm.valor} onChange={(valor) => setProdutoForm({ ...produtoForm, valor })} required />
              <FormActions editing={Boolean(editing.produto)} onCancel={() => cancelEdit('produto')} />
            </form>

            <div className="filter-bar">
              <Field label="Buscar codigo" value={filtroProduto.codigo} onChange={(codigo) => setFiltroProduto({ ...filtroProduto, codigo })} />
              <Field label="Buscar nome" value={filtroProduto.nome} onChange={(nome) => setFiltroProduto({ ...filtroProduto, nome })} />
              <SelectCategoria label="Categoria" value={filtroProduto.categoria} onChange={(categoria) => setFiltroProduto({ ...filtroProduto, categoria })} categorias={categorias} />
              <Field label="Valor min." type="number" step="0.01" value={filtroProduto.valorMin} onChange={(valorMin) => setFiltroProduto({ ...filtroProduto, valorMin })} />
              <Field label="Valor max." type="number" step="0.01" value={filtroProduto.valorMax} onChange={(valorMax) => setFiltroProduto({ ...filtroProduto, valorMax })} />
              <button className="secondary-button" type="button" onClick={() => setFiltroProduto(emptyFiltroProduto)}>
                <X aria-hidden="true" />
                <span>Limpar</span>
              </button>
            </div>

            <DataTable
              columns={['Imagem', 'Codigo', 'Nome', 'Categoria', 'Valor', 'Acoes']}
              rows={produtosFiltrados.map((produto) => [
                produto.imagem ? <img className="product-thumb" src={imageUrl(produto.imagem)} alt={produto.nome} /> : '-',
                produto.codigo,
                produto.nome,
                produto.categoria,
                Number(produto.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                <ActionGroup key="actions">
                  <IconButton icon={Eye} label="Visualizar" onClick={() => setProdutoVisualizado(produto)} />
                  <IconButton icon={Edit3} label="Editar" onClick={() => editProduto(produto)} />
                  <IconButton icon={Trash2} label="Excluir" tone="danger" onClick={() => run(() => remove(`/produtos/${produto.codigo}`, 'Produto excluido.'))} />
                </ActionGroup>,
              ])}
            />
          </CadastroSection>
        )}

        {activeTab === 'estoque' && (
          <CadastroSection title="Cadastro de produtos no estoque">
            <form onSubmit={(event) => run(() => submitEstoque(event))} className="form-grid">
              <label className="field">
                <span>Produto</span>
                <select value={estoqueForm.codigoDoProduto} onChange={(event) => setEstoqueForm({ ...estoqueForm, codigoDoProduto: event.target.value })} required disabled={Boolean(editing.estoque)}>
                  <option value="">Selecione</option>
                  {produtos.map((produto) => (
                    <option key={produto.codigo} value={produto.codigo}>{produto.codigo} - {produto.nome}</option>
                  ))}
                </select>
              </label>
              <Field label={editing.estoque ? 'Quantidade total' : 'Quantidade a adicionar'} type="number" min="0" value={estoqueForm.quantidade} onChange={(quantidade) => setEstoqueForm({ ...estoqueForm, quantidade })} required />
              <FormActions editing={Boolean(editing.estoque)} onCancel={() => cancelEdit('estoque')} />
            </form>
            <DataTable
              columns={['Produto', 'Nome', 'Quantidade', 'Acoes']}
              rows={estoque.map((item) => [
                item.codigoDoProduto,
                produtoMap.get(item.codigoDoProduto)?.nome ?? '-',
                item.quantidade,
                <ActionGroup key="actions">
                  <IconButton icon={Edit3} label="Editar" onClick={() => editEstoque(item)} />
                  <IconButton icon={Trash2} label="Excluir" tone="danger" onClick={() => run(() => remove(`/estoque/${item.codigoDoProduto}`, 'Item de estoque excluido.'))} />
                </ActionGroup>,
              ])}
            />
          </CadastroSection>
        )}

        {activeTab === 'kits' && (
          <CadastroSection title="Cadastro de kit pre montado">
            <form onSubmit={(event) => run(() => submitKit(event))} className="form-grid">
              <Field label="Codigo" value={kitForm.codigo} onChange={(codigo) => setKitForm({ ...kitForm, codigo })} required disabled={Boolean(editing.kit)} />
              <Field label="Produtos" value={kitForm.produtos} onChange={(produtosValue) => setKitForm({ ...kitForm, produtos: produtosValue })} placeholder="PROD-001, PROD-002" required />
              <FormActions editing={Boolean(editing.kit)} onCancel={() => cancelEdit('kit')} />
            </form>
            <DataTable
              columns={['Codigo', 'Produtos', 'Acoes']}
              rows={kits.map((kit) => [
                kit.codigo,
                kit.produtos.join(', '),
                <ActionGroup key="actions">
                  <IconButton icon={Edit3} label="Editar" onClick={() => editKit(kit)} />
                  <IconButton icon={Trash2} label="Excluir" tone="danger" onClick={() => run(() => remove(`/kits-pre-montados/${kit.codigo}`, 'Kit excluido.'))} />
                </ActionGroup>,
              ])}
            />
          </CadastroSection>
        )}
      </section>

      {produtoVisualizado && (
        <ProductModal produto={produtoVisualizado} onClose={() => setProdutoVisualizado(null)} />
      )}
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

function SelectCategoria({ label = 'Categoria', value, onChange, categorias, required = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
        <option value="">Todas</option>
        {categorias.map((categoria) => (
          <option key={categoria.codigo} value={categoria.codigo}>{categoria.nome}</option>
        ))}
      </select>
    </label>
  );
}

function FormActions({ editing, onCancel }) {
  return (
    <div className="form-actions">
      <button className="submit-button" type="submit">
        <Save aria-hidden="true" />
        <span>{editing ? 'Salvar' : 'Cadastrar'}</span>
      </button>
      {editing && (
        <button className="secondary-button" type="button" onClick={onCancel}>
          <X aria-hidden="true" />
          <span>Cancelar</span>
        </button>
      )}
    </div>
  );
}

function ActionGroup({ children }) {
  return <div className="action-group">{children}</div>;
}

function IconButton({ icon: Icon, label, onClick, tone = 'default' }) {
  return (
    <button className={`icon-button ${tone}`} type="button" title={label} aria-label={label} onClick={onClick}>
      <Icon aria-hidden="true" />
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
              <td colSpan={columns.length}>Nenhum registro encontrado.</td>
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

function ProductModal({ produto, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <header>
          <div>
            <h2>{produto.nome}</h2>
            <span>{produto.codigo}</span>
          </div>
          <IconButton icon={X} label="Fechar" onClick={onClose} />
        </header>
        {produto.imagem ? (
          <img className="product-preview" src={imageUrl(produto.imagem)} alt={produto.nome} />
        ) : (
          <div className="empty-image">Sem imagem</div>
        )}
        <dl className="product-details">
          <div><dt>Categoria</dt><dd>{produto.categoria}</dd></div>
          <div><dt>Fabricacao</dt><dd>{produto.fabricacao}</dd></div>
          <div><dt>Cores</dt><dd>{(produto.cores ?? []).join(', ') || '-'}</dd></div>
          <div><dt>Valor</dt><dd>{Number(produto.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</dd></div>
        </dl>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

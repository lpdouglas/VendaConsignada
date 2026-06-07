import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Boxes, Edit3, Eye, PackagePlus, Save, Tags, Trash2, Users, X } from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
const API_BASE_URL = API_URL.replace(/\/api\/?$/, '');

const emptyCategoria = { codigo: '', nome: '' };
const emptyProduto = { codigo: '', nome: '', imagem: '', fabricacao: '', categoria: '', cores: '', valor: '', imagemFile: null };
const emptyEstoque = { codigoDoProduto: '', quantidade: 0 };
const emptyEndereco = { cep: '', endereco: '', numero: '', bairro: '', cidade: '', uf: '' };
const emptyRevendedor = {
  nome: '',
  imagemPerfil: '',
  imagemFile: null,
  cpf: '',
  endereco: emptyEndereco,
  telefone: '',
  email: '',
  contatosDeReferencia: '',
  cadastroAtivo: true,
  situacaoCadastral: 'NORMAL',
};
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const emptyKitRevendedor = {
  codigoDoRevendedor: '',
  dataDeRetirada: new Date().toISOString().slice(0, 10),
  dataDeAcerto: addDays(new Date(), 60).toISOString().slice(0, 10),
  produtosRetirados: [{ codigo: '', quantidade: 1 }],
};

const emptyFiltros = {
  categoria: { codigo: '', nome: '' },
  produto: { codigo: '', nome: '', categoria: '', valorMin: '', valorMax: '' },
  estoque: { codigo: '', nome: '', quantidadeMin: '', quantidadeMax: '' },
  revendedor: { codigo: '', nome: '', cpf: '', situacaoCadastral: '', cadastroAtivo: '' },
  kit: { revendedor: '', produto: '' },
};

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function splitValues(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function pathValue(value) {
  return encodeURIComponent(value);
}

function imageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

function normalizeCpf(cpf) {
  return cpf.replace(/\D/g, '');
}

function maskCpf(value) {
  return normalizeCpf(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskTelefone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

function isValidEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidTelefone(telefone) {
  const digits = telefone.replace(/\D/g, '');
  return !digits || digits.length === 10 || digits.length === 11;
}

function isValidCpf(cpf) {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11 || new Set(digits).size === 1) return false;
  const digit = (length) => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(digits[i]) * (length + 1 - i);
    const result = 11 - (sum % 11);
    return result >= 10 ? 0 : result;
  };
  return digit(9) === Number(digits[9]) && digit(10) === Number(digits[10]);
}

function moeda(value) {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

  if (response.status === 204) return null;
  return response.json();
}

function App() {
  const [activeView, setActiveView] = useState('gerar-kit');
  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [revendedores, setRevendedores] = useState([]);
  const [kitsRevendedor, setKitsRevendedor] = useState([]);
  const [categoriaForm, setCategoriaForm] = useState(emptyCategoria);
  const [produtoForm, setProdutoForm] = useState(emptyProduto);
  const [estoqueForm, setEstoqueForm] = useState(emptyEstoque);
  const [revendedorForm, setRevendedorForm] = useState(emptyRevendedor);
  const [kitForm, setKitForm] = useState(emptyKitRevendedor);
  const [editing, setEditing] = useState({ categoria: null, produto: null, estoque: null, revendedor: null });
  const [filtros, setFiltros] = useState(emptyFiltros);
  const [produtoVisualizado, setProdutoVisualizado] = useState(null);
  const [kitsAtivosRevendedor, setKitsAtivosRevendedor] = useState(null);
  const [fieldStatus, setFieldStatus] = useState({});
  const [toast, setToast] = useState({ type: 'idle', text: 'Conectando com a API em localhost:8080' });

  const produtoMap = useMemo(() => new Map(produtos.map((produto) => [produto.codigo, produto])), [produtos]);
  const estoqueMap = useMemo(() => new Map(estoque.map((item) => [item.codigoDoProduto, item])), [estoque]);
  const revendedorMap = useMemo(() => new Map(revendedores.map((revendedor) => [String(revendedor.codigoDoRevendedor), revendedor])), [revendedores]);

  const categoriasFiltradas = useMemo(() => categorias.filter((categoria) => (
    categoria.codigo.toLowerCase().includes(filtros.categoria.codigo.toLowerCase())
    && categoria.nome.toLowerCase().includes(filtros.categoria.nome.toLowerCase())
  )), [categorias, filtros.categoria]);

  const produtosFiltrados = useMemo(() => produtos.filter((produto) => {
    const valor = Number(produto.valor);
    return produto.codigo.toLowerCase().includes(filtros.produto.codigo.toLowerCase())
      && produto.nome.toLowerCase().includes(filtros.produto.nome.toLowerCase())
      && (!filtros.produto.categoria || produto.categoria === filtros.produto.categoria)
      && (filtros.produto.valorMin === '' || valor >= Number(filtros.produto.valorMin))
      && (filtros.produto.valorMax === '' || valor <= Number(filtros.produto.valorMax));
  }), [produtos, filtros.produto]);

  const estoqueFiltrado = useMemo(() => estoque.filter((item) => {
    const produto = produtoMap.get(item.codigoDoProduto);
    const quantidade = Number(item.quantidade);
    return item.codigoDoProduto.toLowerCase().includes(filtros.estoque.codigo.toLowerCase())
      && (produto?.nome ?? '').toLowerCase().includes(filtros.estoque.nome.toLowerCase())
      && (filtros.estoque.quantidadeMin === '' || quantidade >= Number(filtros.estoque.quantidadeMin))
      && (filtros.estoque.quantidadeMax === '' || quantidade <= Number(filtros.estoque.quantidadeMax));
  }), [estoque, produtoMap, filtros.estoque]);

  const revendedoresFiltrados = useMemo(() => revendedores.filter((revendedor) => (
    String(revendedor.codigoDoRevendedor).includes(filtros.revendedor.codigo)
    && revendedor.nome.toLowerCase().includes(filtros.revendedor.nome.toLowerCase())
    && revendedor.cpf.includes(normalizeCpf(filtros.revendedor.cpf))
    && (!filtros.revendedor.situacaoCadastral || revendedor.situacaoCadastral === filtros.revendedor.situacaoCadastral)
    && (filtros.revendedor.cadastroAtivo === '' || String(Boolean(revendedor.cadastroAtivo)) === filtros.revendedor.cadastroAtivo)
  )), [revendedores, filtros.revendedor]);

  const kitsRevendedorFiltrados = useMemo(() => kitsRevendedor.filter((kit) => (
    (!filtros.kit.revendedor || String(kit.codigoDoRevendedor) === filtros.kit.revendedor)
    && (!filtros.kit.produto || kit.produtosRetirados.some((produto) => produto.codigo === filtros.kit.produto))
  )), [kitsRevendedor, filtros.kit]);

  const kitValidation = useMemo(() => {
    const errors = [];
    if (!kitForm.codigoDoRevendedor) errors.push('Selecione um revendedor.');
    if (kitForm.produtosRetirados.every((produto) => !produto.codigo)) errors.push('Selecione ao menos um produto.');

    const usados = {};
    for (const produto of kitForm.produtosRetirados) {
      if (!produto.codigo) continue;
      usados[produto.codigo] = (usados[produto.codigo] ?? 0) + Number(produto.quantidade || 0);
    }

    for (const [codigo, quantidade] of Object.entries(usados)) {
      const disponivel = Number(estoqueMap.get(codigo)?.quantidade ?? 0);
      if (quantidade <= 0) errors.push(`Quantidade invalida para ${codigo}.`);
      if (quantidade > disponivel) errors.push(`Estoque insuficiente para ${codigo}. Disponivel: ${disponivel}.`);
    }

    return { valid: errors.length === 0, errors };
  }, [kitForm, estoqueMap]);

  const kitValorTotal = useMemo(() => kitForm.produtosRetirados.reduce((total, item) => {
    const produto = produtoMap.get(item.codigo);
    return total + Number(produto?.valor ?? 0) * Number(item.quantidade || 0);
  }, 0), [kitForm.produtosRetirados, produtoMap]);

  async function loadData() {
    const [categoriasData, produtosData, estoqueData, revendedoresData, kitsData] = await Promise.all([
      request('/categorias'),
      request('/produtos'),
      request('/estoque'),
      request('/revendedores'),
      request('/kits-revendedor'),
    ]);
    setCategorias(categoriasData);
    setProdutos(produtosData);
    setEstoque(estoqueData);
    setRevendedores(revendedoresData);
    setKitsRevendedor(kitsData);
    setToast({ type: 'success', text: 'Dados carregados.' });
  }

  useEffect(() => {
    loadData().catch((error) => setToast({ type: 'error', text: error.message }));
  }, []);

  useEffect(() => {
    if (toast.type === 'idle') return undefined;
    const timeout = window.setTimeout(() => setToast({ type: 'idle', text: '' }), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function run(action) {
    setToast({ type: 'idle', text: 'Salvando...' });
    action().catch((error) => setToast({ type: 'error', text: error.message }));
  }

  async function uploadImagem(path, fieldName, arquivo) {
    if (!arquivo) return;
    if (arquivo.size > MAX_IMAGE_SIZE) {
      throw new Error('Imagem deve ter no maximo 2MB.');
    }
    const formData = new FormData();
    formData.append(fieldName, arquivo);
    await request(path, { method: 'POST', body: formData });
  }

  function setRevendedorField(field, value) {
    setRevendedorForm({ ...revendedorForm, [field]: value });
  }

  function validarCampoRevendedor(field) {
    const updates = { ...fieldStatus };
    if (field === 'cpf') {
      updates.cpf = isValidCpf(revendedorForm.cpf) ? 'ok' : 'CPF invalido';
    }
    if (field === 'email') {
      updates.email = isValidEmail(revendedorForm.email) ? 'ok' : 'Email invalido';
    }
    if (field === 'telefone') {
      updates.telefone = isValidTelefone(revendedorForm.telefone) ? 'ok' : 'Telefone invalido';
    }
    setFieldStatus(updates);
  }

  function selectRevendedorImagem(file) {
    if (!file) {
      setRevendedorForm({ ...revendedorForm, imagemFile: null });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setRevendedorForm({ ...revendedorForm, imagemFile: null });
      setToast({ type: 'error', text: 'Imagem deve ter no maximo 2MB.' });
      return;
    }
    setRevendedorForm({ ...revendedorForm, imagemFile: file });
  }

  async function submitCategoria(event) {
    event.preventDefault();
    const method = editing.categoria ? 'PUT' : 'POST';
    const path = editing.categoria ? `/categorias/${pathValue(editing.categoria)}` : '/categorias';
    await request(path, { method, body: JSON.stringify(categoriaForm) });
    setCategoriaForm(emptyCategoria);
    setEditing({ ...editing, categoria: null });
    await loadData();
    setToast({ type: 'success', text: editing.categoria ? 'Categoria atualizada.' : 'Categoria cadastrada.' });
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
    const path = editing.produto ? `/produtos/${pathValue(editing.produto)}` : '/produtos';
    const produtoSalvo = await request(path, { method, body: JSON.stringify(payload) });
    await uploadImagem(`/produtos/${pathValue(produtoSalvo.codigo)}/imagem`, 'imagem', produtoForm.imagemFile);
    setProdutoForm(emptyProduto);
    setEditing({ ...editing, produto: null });
    await loadData();
    setToast({ type: 'success', text: editing.produto ? 'Produto atualizado.' : 'Produto cadastrado.' });
  }

  async function submitEstoque(event) {
    event.preventDefault();
    const payload = { ...estoqueForm, quantidade: Number(estoqueForm.quantidade) };
    const method = editing.estoque ? 'PUT' : 'POST';
    const path = editing.estoque ? `/estoque/${pathValue(editing.estoque)}` : '/estoque';
    await request(path, { method, body: JSON.stringify(payload) });
    setEstoqueForm(emptyEstoque);
    setEditing({ ...editing, estoque: null });
    await loadData();
    setToast({ type: 'success', text: editing.estoque ? 'Estoque atualizado.' : 'Produto incluido no estoque.' });
  }

  async function submitRevendedor(event) {
    event.preventDefault();
    if (!isValidCpf(revendedorForm.cpf)) {
      setToast({ type: 'error', text: 'CPF invalido.' });
      return;
    }
    const cpfNormalizado = normalizeCpf(revendedorForm.cpf);
    const cpfJaUsado = revendedores.some((revendedor) => (
      revendedor.cpf === cpfNormalizado && String(revendedor.codigoDoRevendedor) !== String(editing.revendedor)
    ));
    if (cpfJaUsado) {
      setToast({ type: 'error', text: 'CPF ja foi utilizado por outro revendedor.' });
      return;
    }
    if (!isValidEmail(revendedorForm.email)) {
      setToast({ type: 'error', text: 'Email invalido.' });
      return;
    }
    if (!isValidTelefone(revendedorForm.telefone)) {
      setToast({ type: 'error', text: 'Telefone invalido.' });
      return;
    }

    const payload = {
      ...revendedorForm,
      cpf: cpfNormalizado,
      imagemFile: undefined,
      cadastroAtivo: editing.revendedor ? revendedorForm.cadastroAtivo : true,
    };
    const method = editing.revendedor ? 'PUT' : 'POST';
    const path = editing.revendedor ? `/revendedores/${editing.revendedor}` : '/revendedores';
    const salvo = await request(path, { method, body: JSON.stringify(payload) });
    await uploadImagem(`/revendedores/${salvo.codigoDoRevendedor}/imagem`, 'imagem', revendedorForm.imagemFile);
    setRevendedorForm(emptyRevendedor);
    setFieldStatus({});
    setEditing({ ...editing, revendedor: null });
    await loadData();
    setToast({ type: 'success', text: editing.revendedor ? 'Revendedor atualizado.' : 'Revendedor cadastrado.' });
  }

  async function submitKitRevendedor(event) {
    event.preventDefault();
    if (!kitValidation.valid) {
      setToast({ type: 'error', text: kitValidation.errors[0] });
      return;
    }

    const payload = {
      codigoDoRevendedor: Number(kitForm.codigoDoRevendedor),
      dataDeRetirada: kitForm.dataDeRetirada,
      dataDeAcerto: kitForm.dataDeAcerto,
      produtosRetirados: kitForm.produtosRetirados
        .filter((produto) => produto.codigo)
        .map((produto) => ({ codigo: produto.codigo, quantidade: Number(produto.quantidade) })),
    };
    const salvo = await request('/kits-revendedor', { method: 'POST', body: JSON.stringify(payload) });
    setKitForm({ ...emptyKitRevendedor, dataDeRetirada: new Date().toISOString().slice(0, 10), dataDeAcerto: addDays(new Date(), 60).toISOString().slice(0, 10) });
    await loadData();
    setToast({ type: 'success', text: `Kit ${salvo.codigoDoKit} gerado e estoque atualizado.` });
  }

  async function remove(path, message) {
    await request(path, { method: 'DELETE' });
    await loadData();
    setToast({ type: 'success', text: message });
  }

  async function buscarCep(cep) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data = await response.json();
    if (data.erro) {
      setToast({ type: 'error', text: 'CEP nao encontrado.' });
      return;
    }
    setRevendedorForm({
      ...revendedorForm,
      endereco: {
        ...revendedorForm.endereco,
        cep: digits,
        endereco: data.logradouro ?? '',
        bairro: data.bairro ?? '',
        cidade: data.localidade ?? '',
        uf: data.uf ?? '',
      },
    });
  }

  function setFiltro(type, patch) {
    setFiltros({ ...filtros, [type]: { ...filtros[type], ...patch } });
  }

  function resetFiltro(type) {
    setFiltros({ ...filtros, [type]: emptyFiltros[type] });
  }

  function editCategoria(categoria) {
    setCategoriaForm({ codigo: categoria.codigo, nome: categoria.nome });
    setEditing({ ...editing, categoria: categoria.codigo });
    setActiveView('categorias-cadastrar');
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
    setActiveView('produtos-cadastrar');
  }

  function editEstoque(item) {
    setEstoqueForm({ codigoDoProduto: item.codigoDoProduto, quantidade: item.quantidade });
    setEditing({ ...editing, estoque: item.codigoDoProduto });
    setActiveView('estoque-cadastrar');
  }

  function editRevendedor(revendedor) {
    setRevendedorForm({
      nome: revendedor.nome,
      imagemPerfil: revendedor.imagemPerfil ?? '',
      imagemFile: null,
      cpf: revendedor.cpf,
      endereco: revendedor.endereco ?? emptyEndereco,
      telefone: revendedor.telefone,
      email: revendedor.email ?? '',
      contatosDeReferencia: revendedor.contatosDeReferencia ?? '',
      cadastroAtivo: Boolean(revendedor.cadastroAtivo),
      situacaoCadastral: revendedor.situacaoCadastral ?? 'NORMAL',
    });
    setEditing({ ...editing, revendedor: revendedor.codigoDoRevendedor });
    setActiveView('revendedor-cadastrar');
  }

  function cancelEdit(type) {
    setEditing({ ...editing, [type]: null });
    if (type === 'categoria') setCategoriaForm(emptyCategoria);
    if (type === 'produto') setProdutoForm(emptyProduto);
    if (type === 'estoque') setEstoqueForm(emptyEstoque);
    if (type === 'revendedor') {
      setRevendedorForm(emptyRevendedor);
      setFieldStatus({});
    }
  }

  function limparRevendedorForm() {
    setRevendedorForm(emptyRevendedor);
    setFieldStatus({});
    setEditing({ ...editing, revendedor: null });
  }

  function updateKitProduto(index, field, value) {
    setKitForm({
      ...kitForm,
      produtosRetirados: kitForm.produtosRetirados.map((produto, currentIndex) => (
        currentIndex === index ? { ...produto, [field]: value } : produto
      )),
    });
  }

  function addKitProduto() {
    setKitForm({ ...kitForm, produtosRetirados: [...kitForm.produtosRetirados, { codigo: '', quantidade: 1 }] });
  }

  function removeKitProduto(index) {
    const produtos = kitForm.produtosRetirados.filter((_, currentIndex) => currentIndex !== index);
    setKitForm({ ...kitForm, produtosRetirados: produtos.length ? produtos : [{ codigo: '', quantidade: 1 }] });
  }

  function setDataRetirada(dataDeRetirada) {
    setKitForm({ ...kitForm, dataDeRetirada, dataDeAcerto: addDays(new Date(`${dataDeRetirada}T00:00:00`), 60).toISOString().slice(0, 10) });
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Boxes aria-hidden="true" />
          <div>
            <strong>Venda Consignada</strong>
            <span>Controle operacional</span>
          </div>
        </div>
        <nav className="menu-list" aria-label="Menu principal">
          <MenuButton active={activeView === 'gerar-kit'} icon={PackagePlus} label="Gerar Novo Kit" onClick={() => setActiveView('gerar-kit')} />
          <MenuGroup title="Revendedor" icon={Users} activeView={activeView} items={[
            ['revendedor-buscar', 'Buscar'],
            ['revendedor-cadastrar', 'Cadastrar'],
          ]} onSelect={setActiveView} />
          <MenuGroup title="Produtos" icon={PackagePlus} activeView={activeView} items={[
            ['produtos-buscar', 'Buscar'],
            ['produtos-cadastrar', 'Cadastrar'],
          ]} onSelect={setActiveView} />
          <MenuGroup title="Estoque" icon={Boxes} activeView={activeView} items={[
            ['estoque-buscar', 'Buscar'],
            ['estoque-cadastrar', 'Cadastrar'],
          ]} onSelect={setActiveView} />
          <MenuGroup title="Categorias" icon={Tags} activeView={activeView} items={[
            ['categorias-buscar', 'Buscar'],
            ['categorias-cadastrar', 'Cadastrar'],
          ]} onSelect={setActiveView} />
        </nav>
        <p className={`status ${toast.type}`}>{toast.text || 'Pronto para operar.'}</p>
      </aside>

      <section className="workspace">
        {activeView === 'gerar-kit' && (
          <CadastroSection title="Gerar novo kit">
            <form onSubmit={(event) => run(() => submitKitRevendedor(event))} className="kit-form">
              <div className="form-grid">
                <label className="field">
                  <span>Revendedor</span>
                  <select value={kitForm.codigoDoRevendedor} onChange={(event) => setKitForm({ ...kitForm, codigoDoRevendedor: event.target.value })} required>
                    <option value="">Selecione</option>
                    {revendedores.filter((revendedor) => revendedor.cadastroAtivo).map((revendedor) => (
                      <option key={revendedor.codigoDoRevendedor} value={revendedor.codigoDoRevendedor}>
                        {revendedor.codigoDoRevendedor} - {revendedor.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="Data de retirada" type="date" value={kitForm.dataDeRetirada} onChange={setDataRetirada} required />
                <Field label="Data de acerto" type="date" value={kitForm.dataDeAcerto} onChange={(dataDeAcerto) => setKitForm({ ...kitForm, dataDeAcerto })} required />
              </div>

              <div className="kit-products">
                {kitForm.produtosRetirados.map((item, index) => (
                  <div className="kit-product-row" key={index}>
                    <label className="field">
                      <span>Buscar produto</span>
                      <select value={item.codigo} onChange={(event) => updateKitProduto(index, 'codigo', event.target.value)} required>
                        <option value="">Selecione</option>
                        {estoque.map((estoqueItem) => {
                          const produto = produtoMap.get(estoqueItem.codigoDoProduto);
                          return (
                            <option key={estoqueItem.codigoDoProduto} value={estoqueItem.codigoDoProduto}>
                              {estoqueItem.codigoDoProduto} - {produto?.nome ?? 'Sem nome'} ({estoqueItem.quantidade} em estoque)
                            </option>
                          );
                        })}
                      </select>
                    </label>
                    <Field label="Quantidade" type="number" min="1" value={item.quantidade} onChange={(quantidade) => updateKitProduto(index, 'quantidade', quantidade)} required />
                    <button className="secondary-button compact-button" type="button" onClick={() => removeKitProduto(index)}>
                      <X aria-hidden="true" />
                      <span>Remover</span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={addKitProduto}>
                  <PackagePlus aria-hidden="true" />
                  <span>Produto</span>
                </button>
                <strong className="total-pill">Total: {moeda(kitValorTotal)}</strong>
                <button className="submit-button" type="submit" disabled={!kitValidation.valid}>
                  <Save aria-hidden="true" />
                  <span>Gerar kit</span>
                </button>
              </div>
              {kitValidation.errors.length > 0 && (
                <div className="validation-box">{kitValidation.errors.map((error) => <span key={error}>{error}</span>)}</div>
              )}
            </form>
            <DataTable
              columns={['Kit', 'Revendedor', 'Retirada', 'Acerto', 'Valor']}
              rows={kitsRevendedorFiltrados.map((kit) => [
                kit.codigoDoKit,
                revendedorMap.get(String(kit.codigoDoRevendedor))?.nome ?? kit.codigoDoRevendedor,
                kit.dataDeRetirada,
                kit.dataDeAcerto,
                moeda(kit.valorTotalDeMercadoria),
              ])}
            />
          </CadastroSection>
        )}

        {activeView === 'revendedor-buscar' && (
          <CadastroSection title="Buscar revendedores">
            <div className="filter-bar">
              <Field label="Codigo" value={filtros.revendedor.codigo} onChange={(codigo) => setFiltro('revendedor', { codigo })} />
              <Field label="Nome" value={filtros.revendedor.nome} onChange={(nome) => setFiltro('revendedor', { nome })} />
              <Field label="CPF" value={filtros.revendedor.cpf} onChange={(cpf) => setFiltro('revendedor', { cpf })} />
              <label className="field"><span>Situacao</span><select value={filtros.revendedor.situacaoCadastral} onChange={(event) => setFiltro('revendedor', { situacaoCadastral: event.target.value })}><option value="">Todas</option><option>NORMAL</option><option>NEGATIVADO</option><option>CALOTE</option></select></label>
              <label className="field"><span>Ativo</span><select value={filtros.revendedor.cadastroAtivo} onChange={(event) => setFiltro('revendedor', { cadastroAtivo: event.target.value })}><option value="">Todos</option><option value="true">Ativo</option><option value="false">Inativo</option></select></label>
              <button className="secondary-button" type="button" onClick={() => resetFiltro('revendedor')}><X aria-hidden="true" /><span>Limpar</span></button>
            </div>
            <DataTable
              columns={['Foto', 'Codigo', 'Nome', 'CPF', 'Telefone', 'Situacao', 'Acoes']}
              rows={revendedoresFiltrados.map((revendedor) => [
                revendedor.imagemPerfil ? <img className="product-thumb" src={imageUrl(revendedor.imagemPerfil)} alt={revendedor.nome} /> : '-',
                revendedor.codigoDoRevendedor,
                revendedor.nome,
                maskCpf(revendedor.cpf),
                maskTelefone(revendedor.telefone ?? ''),
                `${revendedor.situacaoCadastral} / ${revendedor.cadastroAtivo ? 'Ativo' : 'Inativo'}`,
                <ActionGroup key="actions"><IconButton icon={Eye} label="Kits ativos" onClick={() => setKitsAtivosRevendedor(revendedor)} /><IconButton icon={Edit3} label="Editar" onClick={() => editRevendedor(revendedor)} /><IconButton icon={Trash2} label="Excluir" tone="danger" onClick={() => run(() => remove(`/revendedores/${revendedor.codigoDoRevendedor}`, 'Revendedor excluido.'))} /></ActionGroup>,
              ])}
            />
          </CadastroSection>
        )}

        {activeView === 'revendedor-cadastrar' && (
          <CadastroSection title={editing.revendedor ? 'Editar revendedor' : 'Cadastrar revendedor'}>
            <form onSubmit={(event) => run(() => submitRevendedor(event))} className="form-grid wide">
              <Field label="Nome" value={revendedorForm.nome} onChange={(nome) => setRevendedorField('nome', nome)} required />
              <Field label="CPF" value={maskCpf(revendedorForm.cpf)} onChange={(cpf) => setRevendedorField('cpf', maskCpf(cpf))} onBlur={() => validarCampoRevendedor('cpf')} status={fieldStatus.cpf} required />
              <Field label="Telefone" value={maskTelefone(revendedorForm.telefone)} onChange={(telefone) => setRevendedorField('telefone', maskTelefone(telefone))} onBlur={() => validarCampoRevendedor('telefone')} status={fieldStatus.telefone} />
              <Field label="Email" type="email" value={revendedorForm.email} onChange={(email) => setRevendedorField('email', email)} onBlur={() => validarCampoRevendedor('email')} status={fieldStatus.email} />
              <label className="field"><span>Situacao cadastral</span><select value={revendedorForm.situacaoCadastral} onChange={(event) => setRevendedorForm({ ...revendedorForm, situacaoCadastral: event.target.value })}><option>NORMAL</option><option>NEGATIVADO</option><option>CALOTE</option></select></label>
              {editing.revendedor && <label className="field checkbox-field"><input type="checkbox" checked={revendedorForm.cadastroAtivo} onChange={(event) => setRevendedorForm({ ...revendedorForm, cadastroAtivo: event.target.checked })} /><span>Cadastro ativo</span></label>}
              <label className="field"><span>Imagem perfil ate 2MB</span><input type="file" accept="image/*" onChange={(event) => selectRevendedorImagem(event.target.files?.[0] ?? null)} /></label>
              <TextAreaField label="Contatos referencia" value={revendedorForm.contatosDeReferencia} onChange={(contatosDeReferencia) => setRevendedorForm({ ...revendedorForm, contatosDeReferencia })} />
              <Field label="CEP" value={revendedorForm.endereco.cep} onChange={(cep) => setRevendedorForm({ ...revendedorForm, endereco: { ...revendedorForm.endereco, cep } })} onBlur={(event) => buscarCep(event.target.value)} />
              <Field label="Endereco" value={revendedorForm.endereco.endereco} onChange={(endereco) => setRevendedorForm({ ...revendedorForm, endereco: { ...revendedorForm.endereco, endereco } })} />
              <Field label="Numero" value={revendedorForm.endereco.numero} onChange={(numero) => setRevendedorForm({ ...revendedorForm, endereco: { ...revendedorForm.endereco, numero } })} />
              <Field label="Bairro" value={revendedorForm.endereco.bairro} onChange={(bairro) => setRevendedorForm({ ...revendedorForm, endereco: { ...revendedorForm.endereco, bairro } })} />
              <Field label="Cidade" value={revendedorForm.endereco.cidade} onChange={(cidade) => setRevendedorForm({ ...revendedorForm, endereco: { ...revendedorForm.endereco, cidade } })} />
              <Field label="UF" value={revendedorForm.endereco.uf} onChange={(uf) => setRevendedorForm({ ...revendedorForm, endereco: { ...revendedorForm.endereco, uf } })} />
              <div className="form-actions">
                <FormActions editing={Boolean(editing.revendedor)} onCancel={() => cancelEdit('revendedor')} />
                <button className="secondary-button" type="button" onClick={limparRevendedorForm}><X aria-hidden="true" /><span>Limpar tudo</span></button>
              </div>
            </form>
          </CadastroSection>
        )}

        {activeView === 'produtos-buscar' && <ProdutosBuscar produtos={produtosFiltrados} categorias={categorias} filtros={filtros} setFiltro={setFiltro} resetFiltro={resetFiltro} editProduto={editProduto} setProdutoVisualizado={setProdutoVisualizado} remove={remove} run={run} />}
        {activeView === 'produtos-cadastrar' && <ProdutosCadastrar produtoForm={produtoForm} setProdutoForm={setProdutoForm} categorias={categorias} editing={editing} cancelEdit={cancelEdit} submitProduto={submitProduto} run={run} />}
        {activeView === 'estoque-buscar' && <EstoqueBuscar estoque={estoqueFiltrado} produtoMap={produtoMap} filtros={filtros} setFiltro={setFiltro} resetFiltro={resetFiltro} editEstoque={editEstoque} remove={remove} run={run} />}
        {activeView === 'estoque-cadastrar' && <EstoqueCadastrar estoqueForm={estoqueForm} setEstoqueForm={setEstoqueForm} produtos={produtos} editing={editing} cancelEdit={cancelEdit} submitEstoque={submitEstoque} run={run} />}
        {activeView === 'categorias-buscar' && <CategoriasBuscar categorias={categoriasFiltradas} filtros={filtros} setFiltro={setFiltro} resetFiltro={resetFiltro} editCategoria={editCategoria} remove={remove} run={run} />}
        {activeView === 'categorias-cadastrar' && <CategoriasCadastrar categoriaForm={categoriaForm} setCategoriaForm={setCategoriaForm} editing={editing} cancelEdit={cancelEdit} submitCategoria={submitCategoria} run={run} />}
      </section>

      {produtoVisualizado && <ProductModal produto={produtoVisualizado} onClose={() => setProdutoVisualizado(null)} />}
      {kitsAtivosRevendedor && (
        <KitsAtivosModal
          revendedor={kitsAtivosRevendedor}
          kits={kitsRevendedor.filter((kit) => String(kit.codigoDoRevendedor) === String(kitsAtivosRevendedor.codigoDoRevendedor))}
          onClose={() => setKitsAtivosRevendedor(null)}
        />
      )}
      {toast.type !== 'idle' && toast.text && <Toast type={toast.type} text={toast.text} onClose={() => setToast({ type: 'idle', text: '' })} />}
    </main>
  );
}

function MenuButton({ active, icon: Icon, label, onClick }) {
  return <button className={active ? 'active' : ''} type="button" onClick={onClick}><Icon aria-hidden="true" /><span>{label}</span></button>;
}

function MenuGroup({ title, icon: Icon, items, activeView, onSelect }) {
  return (
    <div className="menu-group">
      <div className="menu-title"><Icon aria-hidden="true" /><span>{title}</span></div>
      <div className="submenu">
        {items.map(([key, label]) => <button key={key} className={activeView === key ? 'active' : ''} type="button" onClick={() => onSelect(key)}>{label}</button>)}
      </div>
    </div>
  );
}

function ProdutosBuscar({ produtos, categorias, filtros, setFiltro, resetFiltro, editProduto, setProdutoVisualizado, remove, run }) {
  return (
    <CadastroSection title="Buscar produtos">
      <div className="filter-bar">
        <Field label="Codigo" value={filtros.produto.codigo} onChange={(codigo) => setFiltro('produto', { codigo })} />
        <Field label="Nome" value={filtros.produto.nome} onChange={(nome) => setFiltro('produto', { nome })} />
        <SelectCategoria label="Categoria" value={filtros.produto.categoria} onChange={(categoria) => setFiltro('produto', { categoria })} categorias={categorias} />
        <Field label="Valor min." type="number" value={filtros.produto.valorMin} onChange={(valorMin) => setFiltro('produto', { valorMin })} />
        <Field label="Valor max." type="number" value={filtros.produto.valorMax} onChange={(valorMax) => setFiltro('produto', { valorMax })} />
        <button className="secondary-button" type="button" onClick={() => resetFiltro('produto')}><X aria-hidden="true" /><span>Limpar</span></button>
      </div>
      <DataTable columns={['Imagem', 'Codigo', 'Nome', 'Categoria', 'Valor', 'Acoes']} rows={produtos.map((produto) => [
        produto.imagem ? <img className="product-thumb" src={imageUrl(produto.imagem)} alt={produto.nome} /> : '-',
        produto.codigo,
        produto.nome,
        produto.categoria,
        moeda(produto.valor),
        <ActionGroup key="actions"><IconButton icon={Eye} label="Visualizar" onClick={() => setProdutoVisualizado(produto)} /><IconButton icon={Edit3} label="Editar" onClick={() => editProduto(produto)} /><IconButton icon={Trash2} label="Excluir" tone="danger" onClick={() => run(() => remove(`/produtos/${pathValue(produto.codigo)}`, 'Produto excluido.'))} /></ActionGroup>,
      ])} />
    </CadastroSection>
  );
}

function ProdutosCadastrar({ produtoForm, setProdutoForm, categorias, editing, cancelEdit, submitProduto, run }) {
  return (
    <CadastroSection title={editing.produto ? 'Editar produto' : 'Cadastrar produto'}>
      <form onSubmit={(event) => run(() => submitProduto(event))} className="form-grid wide">
        <Field label="Codigo" value={produtoForm.codigo} onChange={(codigo) => setProdutoForm({ ...produtoForm, codigo })} required disabled={Boolean(editing.produto)} />
        <Field label="Nome" value={produtoForm.nome} onChange={(nome) => setProdutoForm({ ...produtoForm, nome })} required />
        <label className="field"><span>Imagem local</span><input type="file" accept="image/*" onChange={(event) => setProdutoForm({ ...produtoForm, imagemFile: event.target.files?.[0] ?? null })} /></label>
        <Field label="Fabricacao" type="date" value={produtoForm.fabricacao} onChange={(fabricacao) => setProdutoForm({ ...produtoForm, fabricacao })} required />
        <SelectCategoria value={produtoForm.categoria} onChange={(categoria) => setProdutoForm({ ...produtoForm, categoria })} categorias={categorias} required />
        <Field label="Cores" value={produtoForm.cores} onChange={(cores) => setProdutoForm({ ...produtoForm, cores })} placeholder="preto, branco, azul" />
        <Field label="Valor" type="number" step="0.01" value={produtoForm.valor} onChange={(valor) => setProdutoForm({ ...produtoForm, valor })} required />
        <FormActions editing={Boolean(editing.produto)} onCancel={() => cancelEdit('produto')} />
      </form>
    </CadastroSection>
  );
}

function EstoqueBuscar({ estoque, produtoMap, filtros, setFiltro, resetFiltro, editEstoque, remove, run }) {
  return (
    <CadastroSection title="Buscar estoque">
      <div className="filter-bar">
        <Field label="Codigo" value={filtros.estoque.codigo} onChange={(codigo) => setFiltro('estoque', { codigo })} />
        <Field label="Nome" value={filtros.estoque.nome} onChange={(nome) => setFiltro('estoque', { nome })} />
        <Field label="Qtd. min." type="number" value={filtros.estoque.quantidadeMin} onChange={(quantidadeMin) => setFiltro('estoque', { quantidadeMin })} />
        <Field label="Qtd. max." type="number" value={filtros.estoque.quantidadeMax} onChange={(quantidadeMax) => setFiltro('estoque', { quantidadeMax })} />
        <button className="secondary-button" type="button" onClick={() => resetFiltro('estoque')}><X aria-hidden="true" /><span>Limpar</span></button>
      </div>
      <DataTable columns={['Produto', 'Nome', 'Quantidade', 'Acoes']} rows={estoque.map((item) => [
        item.codigoDoProduto,
        produtoMap.get(item.codigoDoProduto)?.nome ?? '-',
        item.quantidade,
        <ActionGroup key="actions"><IconButton icon={Edit3} label="Editar" onClick={() => editEstoque(item)} /><IconButton icon={Trash2} label="Excluir" tone="danger" onClick={() => run(() => remove(`/estoque/${pathValue(item.codigoDoProduto)}`, 'Item de estoque excluido.'))} /></ActionGroup>,
      ])} />
    </CadastroSection>
  );
}

function EstoqueCadastrar({ estoqueForm, setEstoqueForm, produtos, editing, cancelEdit, submitEstoque, run }) {
  return (
    <CadastroSection title={editing.estoque ? 'Editar estoque' : 'Cadastrar estoque'}>
      <form onSubmit={(event) => run(() => submitEstoque(event))} className="form-grid">
        <label className="field"><span>Produto</span><select value={estoqueForm.codigoDoProduto} onChange={(event) => setEstoqueForm({ ...estoqueForm, codigoDoProduto: event.target.value })} required disabled={Boolean(editing.estoque)}><option value="">Selecione</option>{produtos.map((produto) => <option key={produto.codigo} value={produto.codigo}>{produto.codigo} - {produto.nome}</option>)}</select></label>
        <Field label={editing.estoque ? 'Quantidade total' : 'Quantidade a adicionar'} type="number" min="0" value={estoqueForm.quantidade} onChange={(quantidade) => setEstoqueForm({ ...estoqueForm, quantidade })} required />
        <FormActions editing={Boolean(editing.estoque)} onCancel={() => cancelEdit('estoque')} />
      </form>
    </CadastroSection>
  );
}

function CategoriasBuscar({ categorias, filtros, setFiltro, resetFiltro, editCategoria, remove, run }) {
  return (
    <CadastroSection title="Buscar categorias">
      <div className="filter-bar compact">
        <Field label="Codigo" value={filtros.categoria.codigo} onChange={(codigo) => setFiltro('categoria', { codigo })} />
        <Field label="Nome" value={filtros.categoria.nome} onChange={(nome) => setFiltro('categoria', { nome })} />
        <button className="secondary-button" type="button" onClick={() => resetFiltro('categoria')}><X aria-hidden="true" /><span>Limpar</span></button>
      </div>
      <DataTable columns={['Codigo', 'Nome', 'Acoes']} rows={categorias.map((categoria) => [
        categoria.codigo,
        categoria.nome,
        <ActionGroup key="actions"><IconButton icon={Edit3} label="Editar" onClick={() => editCategoria(categoria)} /><IconButton icon={Trash2} label="Excluir" tone="danger" onClick={() => run(() => remove(`/categorias/${pathValue(categoria.codigo)}`, 'Categoria excluida.'))} /></ActionGroup>,
      ])} />
    </CadastroSection>
  );
}

function CategoriasCadastrar({ categoriaForm, setCategoriaForm, editing, cancelEdit, submitCategoria, run }) {
  return (
    <CadastroSection title={editing.categoria ? 'Editar categoria' : 'Cadastrar categoria'}>
      <form onSubmit={(event) => run(() => submitCategoria(event))} className="form-grid">
        <Field label="Codigo" value={categoriaForm.codigo} onChange={(codigo) => setCategoriaForm({ ...categoriaForm, codigo })} required disabled={Boolean(editing.categoria)} />
        <Field label="Nome" value={categoriaForm.nome} onChange={(nome) => setCategoriaForm({ ...categoriaForm, nome })} required />
        <FormActions editing={Boolean(editing.categoria)} onCancel={() => cancelEdit('categoria')} />
      </form>
    </CadastroSection>
  );
}

function CadastroSection({ title, children }) {
  return <div className="cadastro-section"><header><h1>{title}</h1></header>{children}</div>;
}

function Field({ label, value, onChange, status, ...props }) {
  return (
    <label className={`field ${status && status !== 'ok' ? 'invalid' : ''} ${status === 'ok' ? 'valid' : ''}`}>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} {...props} />
      {status && <small>{status === 'ok' ? 'OK' : status}</small>}
    </label>
  );
}

function TextAreaField({ label, value, onChange, ...props }) {
  return (
    <label className="field textarea-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} {...props} />
    </label>
  );
}

function SelectCategoria({ label = 'Categoria', value, onChange, categorias, required = false }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} required={required}><option value="">{required ? 'Selecione' : 'Todas'}</option>{categorias.map((categoria) => <option key={categoria.codigo} value={categoria.codigo}>{categoria.nome}</option>)}</select></label>;
}

function FormActions({ editing, onCancel, disabled = false }) {
  return (
    <div className="form-actions">
      <button className="submit-button" type="submit" disabled={disabled}><Save aria-hidden="true" /><span>{editing ? 'Salvar' : 'Cadastrar'}</span></button>
      {editing && <button className="secondary-button" type="button" onClick={onCancel}><X aria-hidden="true" /><span>Cancelar</span></button>}
    </div>
  );
}

function ActionGroup({ children }) {
  return <div className="action-group">{children}</div>;
}

function IconButton({ icon: Icon, label, onClick, tone = 'default' }) {
  return <button className={`icon-button ${tone}`} type="button" title={label} aria-label={label} onClick={onClick}><Icon aria-hidden="true" /></button>;
}

function DataTable({ columns, rows }) {
  return (
    <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={columns.length}>Nenhum registro encontrado.</td></tr> : rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
  );
}

function ProductModal({ produto, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <header><div><h2>{produto.nome}</h2><span>{produto.codigo}</span></div><IconButton icon={X} label="Fechar" onClick={onClose} /></header>
        {produto.imagem ? <img className="product-preview" src={imageUrl(produto.imagem)} alt={produto.nome} /> : <div className="empty-image">Sem imagem</div>}
        <dl className="product-details">
          <div><dt>Categoria</dt><dd>{produto.categoria}</dd></div>
          <div><dt>Fabricacao</dt><dd>{produto.fabricacao}</dd></div>
          <div><dt>Cores</dt><dd>{(produto.cores ?? []).join(', ') || '-'}</dd></div>
          <div><dt>Valor</dt><dd>{moeda(produto.valor)}</dd></div>
        </dl>
      </div>
    </div>
  );
}

function KitsAtivosModal({ revendedor, kits, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <header><div><h2>Kits ativos</h2><span>{revendedor.codigoDoRevendedor} - {revendedor.nome}</span></div><IconButton icon={X} label="Fechar" onClick={onClose} /></header>
        <DataTable
          columns={['Kit', 'Retirada', 'Acerto', 'Valor', 'Produtos']}
          rows={kits.map((kit) => [
            kit.codigoDoKit,
            kit.dataDeRetirada,
            kit.dataDeAcerto,
            moeda(kit.valorTotalDeMercadoria),
            kit.produtosRetirados.map((produto) => `${produto.codigo} (${produto.quantidade})`).join(', '),
          ])}
        />
      </div>
    </div>
  );
}

function Toast({ type, text, onClose }) {
  return (
    <div className={`toast ${type}`} role="alert">
      <span>{text}</span>
      <button type="button" onClick={onClose} aria-label="Fechar aviso"><X aria-hidden="true" /></button>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

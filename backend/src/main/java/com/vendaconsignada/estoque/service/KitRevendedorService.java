package com.vendaconsignada.estoque.service;

import com.vendaconsignada.estoque.model.KitRevendedor;
import com.vendaconsignada.estoque.model.Produto;
import com.vendaconsignada.estoque.model.ProdutoNoEstoque;
import com.vendaconsignada.estoque.model.ProdutoRetirado;
import com.vendaconsignada.estoque.model.Revendedor;
import com.vendaconsignada.estoque.repository.KitRevendedorRepository;
import com.vendaconsignada.estoque.repository.ProdutoNoEstoqueRepository;
import com.vendaconsignada.estoque.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class KitRevendedorService {

    private final KitRevendedorRepository repository;
    private final ProdutoNoEstoqueRepository estoqueRepository;
    private final ProdutoRepository produtoRepository;
    private final RevendedorService revendedorService;
    private final SequenceGeneratorService sequenceGeneratorService;

    public List<KitRevendedor> listar() {
        return repository.findAll();
    }

    public KitRevendedor buscarPorCodigo(Long codigo) {
        return repository.findByCodigoDoKit(codigo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kit do revendedor nao encontrado"));
    }

    public synchronized KitRevendedor salvar(KitRevendedor kit) {
        Revendedor revendedor = revendedorService.buscarPorCodigo(kit.getCodigoDoRevendedor());
        if (!Boolean.TRUE.equals(revendedor.getCadastroAtivo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Revendedor inativo");
        }

        kit.setId(null);
        kit.setCodigoDoKit(proximoCodigoDisponivel());
        if (kit.getDataDeAcerto() == null) {
            kit.setDataDeAcerto(kit.getDataDeRetirada().plusDays(60));
        }
        prepararProdutosEValidarEstoque(kit);
        baixarEstoque(kit.getProdutosRetirados());
        KitRevendedor salvo = persistir(kit);
        revendedorService.adicionarKitAtivo(revendedor.getCodigoDoRevendedor(), salvo.getCodigoDoKit());
        return salvo;
    }

    private void prepararProdutosEValidarEstoque(KitRevendedor kit) {
        Map<String, Long> totais = agruparProdutos(kit.getProdutosRetirados());
        for (Map.Entry<String, Long> total : totais.entrySet()) {
            ProdutoNoEstoque estoque = estoqueRepository.findByCodigoDoProduto(total.getKey())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto nao esta no estoque: " + total.getKey()));
            if (estoque.getQuantidade() < total.getValue()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Estoque insuficiente para " + total.getKey() + ". Disponivel: " + estoque.getQuantidade()
                );
            }
        }

        BigDecimal valorTotal = BigDecimal.ZERO;
        for (ProdutoRetirado item : kit.getProdutosRetirados()) {
            Produto produto = produtoRepository.findByCodigo(item.getCodigo())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto nao encontrado: " + item.getCodigo()));
            item.setValor(produto.getValor());
            valorTotal = valorTotal.add(produto.getValor().multiply(BigDecimal.valueOf(item.getQuantidade())));
        }
        kit.setValorTotalDeMercadoria(valorTotal);
    }

    private void baixarEstoque(List<ProdutoRetirado> produtos) {
        Map<String, Long> totais = agruparProdutos(produtos);
        for (Map.Entry<String, Long> total : totais.entrySet()) {
            ProdutoNoEstoque estoque = estoqueRepository.findByCodigoDoProduto(total.getKey())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto nao esta no estoque: " + total.getKey()));
            estoque.setQuantidade(estoque.getQuantidade() - total.getValue());
            estoqueRepository.save(estoque);
        }
    }

    private Map<String, Long> agruparProdutos(List<ProdutoRetirado> produtos) {
        Map<String, Long> totais = new HashMap<>();
        for (ProdutoRetirado produto : produtos) {
            totais.merge(produto.getCodigo(), produto.getQuantidade(), Long::sum);
        }
        return totais;
    }

    private Long proximoCodigoDisponivel() {
        Long codigo = sequenceGeneratorService.next("kit-revendedor");
        while (repository.existsByCodigoDoKit(codigo)) {
            codigo = sequenceGeneratorService.next("kit-revendedor");
        }
        return codigo;
    }

    private KitRevendedor persistir(KitRevendedor kit) {
        try {
            return repository.save(kit);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Codigo de kit ja cadastrado", ex);
        }
    }
}

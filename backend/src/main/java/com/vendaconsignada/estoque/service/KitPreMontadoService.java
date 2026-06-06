package com.vendaconsignada.estoque.service;

import com.vendaconsignada.estoque.model.KitPreMontado;
import com.vendaconsignada.estoque.model.KitProduto;
import com.vendaconsignada.estoque.model.ProdutoNoEstoque;
import com.vendaconsignada.estoque.repository.KitPreMontadoRepository;
import com.vendaconsignada.estoque.repository.ProdutoNoEstoqueRepository;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class KitPreMontadoService {

    private final KitPreMontadoRepository repository;
    private final ProdutoNoEstoqueRepository estoqueRepository;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final MongoTemplate mongoTemplate;

    public List<KitPreMontado> listar() {
        migrarKitsLegados();
        return repository.findAll();
    }

    public KitPreMontado buscarPorCodigo(Long codigo) {
        migrarKitsLegados();
        return repository.findByCodigo(codigo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kit pre montado nao encontrado"));
    }

    public synchronized KitPreMontado salvar(KitPreMontado kit) {
        migrarKitsLegados();
        kit.setId(null);
        kit.setCodigo(proximoCodigoDisponivel());
        validarProdutosNoEstoque(kit.getProdutos());
        aplicarMovimentoEstoque(Map.of(), agruparProdutos(kit.getProdutos()));
        return persistir(kit);
    }

    public synchronized KitPreMontado atualizar(Long codigo, KitPreMontado kit) {
        KitPreMontado atual = buscarPorCodigo(codigo);
        kit.setId(atual.getId());
        kit.setCodigo(codigo);
        validarProdutosNoEstoque(kit.getProdutos());
        aplicarMovimentoEstoque(agruparProdutos(atual.getProdutos()), agruparProdutos(kit.getProdutos()));
        return persistir(kit);
    }

    public synchronized void excluir(Long codigo) {
        KitPreMontado kit = buscarPorCodigo(codigo);
        aplicarMovimentoEstoque(agruparProdutos(kit.getProdutos()), Map.of());
        repository.delete(kit);
    }

    private void validarProdutosNoEstoque(List<KitProduto> produtos) {
        for (KitProduto produto : produtos) {
            if (!estoqueRepository.existsByCodigoDoProduto(produto.getCodigo())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto do kit nao existe no estoque: " + produto.getCodigo());
            }
        }
    }

    private Map<String, Long> agruparProdutos(List<KitProduto> produtos) {
        Map<String, Long> agrupados = new HashMap<>();
        for (KitProduto produto : produtos) {
            agrupados.merge(produto.getCodigo(), produto.getQuantidade(), Long::sum);
        }
        return agrupados;
    }

    private void aplicarMovimentoEstoque(Map<String, Long> produtosAtuais, Map<String, Long> produtosNovos) {
        Map<String, Long> deltas = new HashMap<>();
        produtosAtuais.forEach((codigo, quantidade) -> deltas.merge(codigo, -quantidade, Long::sum));
        produtosNovos.forEach((codigo, quantidade) -> deltas.merge(codigo, quantidade, Long::sum));

        for (Map.Entry<String, Long> delta : deltas.entrySet()) {
            if (delta.getValue() > 0) {
                ProdutoNoEstoque estoque = buscarEstoque(delta.getKey());
                if (estoque.getQuantidade() < delta.getValue()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Estoque insuficiente para " + delta.getKey() + ". Disponivel: " + estoque.getQuantidade()
                    );
                }
            }
        }

        for (Map.Entry<String, Long> delta : deltas.entrySet()) {
            if (delta.getValue() == 0) {
                continue;
            }

            ProdutoNoEstoque estoque = buscarEstoque(delta.getKey());
            estoque.setQuantidade(estoque.getQuantidade() - delta.getValue());
            estoqueRepository.save(estoque);
        }
    }

    private ProdutoNoEstoque buscarEstoque(String codigoProduto) {
        return estoqueRepository.findByCodigoDoProduto(codigoProduto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto do kit nao existe no estoque: " + codigoProduto));
    }

    private Long proximoCodigoDisponivel() {
        Long codigo = sequenceGeneratorService.next("kit-pre-montado");
        while (repository.existsByCodigo(codigo)) {
            codigo = sequenceGeneratorService.next("kit-pre-montado");
        }
        return codigo;
    }

    private void migrarKitsLegados() {
        for (Document document : mongoTemplate.getCollection("kit-pre-montado").find()) {
            Object codigo = document.get("codigo");
            Object produtos = document.get("produtos");
            boolean deveAtualizar = false;
            Document atualizacao = new Document();

            if (!(codigo instanceof Number)) {
                atualizacao.append("codigo", proximoCodigoDisponivel());
                deveAtualizar = true;
            }

            if (produtos instanceof List<?> listaProdutos && listaProdutos.stream().anyMatch(String.class::isInstance)) {
                List<Map<String, Object>> produtosMigrados = new ArrayList<>();
                for (Object produto : listaProdutos) {
                    if (produto instanceof String codigoProduto) {
                        produtosMigrados.add(Map.of("codigo", codigoProduto, "quantidade", 1));
                    } else if (produto instanceof Document produtoDocument) {
                        produtosMigrados.add(produtoDocument);
                    }
                }
                atualizacao.append("produtos", produtosMigrados);
                deveAtualizar = true;
            }

            if (deveAtualizar) {
                mongoTemplate.getCollection("kit-pre-montado")
                        .updateOne(new Document("_id", document.get("_id")), new Document("$set", atualizacao));
            }
        }
    }

    private KitPreMontado persistir(KitPreMontado kit) {
        try {
            return repository.save(kit);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Codigo de kit ja cadastrado", ex);
        }
    }
}

package com.vendaconsignada.estoque.service;

import com.vendaconsignada.estoque.model.KitPreMontado;
import com.vendaconsignada.estoque.model.KitProduto;
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

    public KitPreMontado salvar(KitPreMontado kit) {
        migrarKitsLegados();
        kit.setId(null);
        kit.setCodigo(proximoCodigoDisponivel());
        validarProdutos(kit.getProdutos());
        return persistir(kit);
    }

    public KitPreMontado atualizar(Long codigo, KitPreMontado kit) {
        KitPreMontado atual = buscarPorCodigo(codigo);
        kit.setId(atual.getId());
        kit.setCodigo(codigo);
        validarProdutos(kit.getProdutos());
        return persistir(kit);
    }

    public void excluir(Long codigo) {
        repository.delete(buscarPorCodigo(codigo));
    }

    private void validarProdutos(List<KitProduto> produtos) {
        for (KitProduto produto : produtos) {
            if (!estoqueRepository.existsByCodigoDoProduto(produto.getCodigo())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto do kit nao existe no estoque: " + produto.getCodigo());
            }
        }
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

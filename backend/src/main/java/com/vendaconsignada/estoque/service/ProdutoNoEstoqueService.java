package com.vendaconsignada.estoque.service;

import com.vendaconsignada.estoque.model.ProdutoNoEstoque;
import com.vendaconsignada.estoque.repository.ProdutoNoEstoqueRepository;
import com.vendaconsignada.estoque.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProdutoNoEstoqueService {

    private final ProdutoNoEstoqueRepository repository;
    private final ProdutoRepository produtoRepository;

    public List<ProdutoNoEstoque> listar() {
        return repository.findAll();
    }

    public ProdutoNoEstoque buscarPorCodigoDoProduto(String codigoDoProduto) {
        return repository.findByCodigoDoProduto(codigoDoProduto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto no estoque nao encontrado"));
    }

    public ProdutoNoEstoque salvar(ProdutoNoEstoque estoque) {
        validarProduto(estoque.getCodigoDoProduto());
        return repository.findByCodigoDoProduto(estoque.getCodigoDoProduto())
                .map(atual -> {
                    atual.setQuantidade(atual.getQuantidade() + estoque.getQuantidade());
                    return repository.save(atual);
                })
                .orElseGet(() -> {
                    estoque.setId(null);
                    return persistir(estoque);
                });
    }

    public ProdutoNoEstoque atualizar(String codigoDoProduto, ProdutoNoEstoque estoque) {
        ProdutoNoEstoque atual = buscarPorCodigoDoProduto(codigoDoProduto);
        validarProduto(codigoDoProduto);
        atual.setQuantidade(estoque.getQuantidade());
        return repository.save(atual);
    }

    public void excluir(String codigoDoProduto) {
        buscarPorCodigoDoProduto(codigoDoProduto);
        repository.deleteByCodigoDoProduto(codigoDoProduto);
    }

    private void validarProduto(String codigoProduto) {
        if (!produtoRepository.existsByCodigo(codigoProduto)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto informado nao existe");
        }
    }

    private ProdutoNoEstoque persistir(ProdutoNoEstoque estoque) {
        try {
            return repository.save(estoque);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto ja cadastrado no estoque", ex);
        }
    }
}

package com.vendaconsignada.estoque.service;

import com.vendaconsignada.estoque.model.Produto;
import com.vendaconsignada.estoque.repository.CategoriaRepository;
import com.vendaconsignada.estoque.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository repository;
    private final CategoriaRepository categoriaRepository;

    public List<Produto> listar() {
        return repository.findAll();
    }

    public Produto buscarPorCodigo(String codigo) {
        return repository.findByCodigo(codigo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto nao encontrado"));
    }

    public Produto salvar(Produto produto) {
        produto.setId(null);
        validarCategoria(produto.getCategoria());
        return persistir(produto);
    }

    public Produto atualizar(String codigo, Produto produto) {
        Produto atual = buscarPorCodigo(codigo);
        produto.setId(atual.getId());
        produto.setCodigo(codigo);
        validarCategoria(produto.getCategoria());
        return persistir(produto);
    }

    public void excluir(String codigo) {
        repository.delete(buscarPorCodigo(codigo));
    }

    private void validarCategoria(String codigoCategoria) {
        if (!categoriaRepository.existsByCodigo(codigoCategoria)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria informada nao existe");
        }
    }

    private Produto persistir(Produto produto) {
        try {
            return repository.save(produto);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Codigo de produto ja cadastrado", ex);
        }
    }
}

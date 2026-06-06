package com.vendaconsignada.estoque.service;

import com.vendaconsignada.estoque.model.Categoria;
import com.vendaconsignada.estoque.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository repository;

    public List<Categoria> listar() {
        return repository.findAll();
    }

    public Categoria buscarPorCodigo(String codigo) {
        return repository.findByCodigo(codigo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria nao encontrada"));
    }

    public Categoria salvar(Categoria categoria) {
        categoria.setId(null);
        return persistir(categoria);
    }

    public Categoria atualizar(String codigo, Categoria categoria) {
        Categoria atual = buscarPorCodigo(codigo);
        categoria.setId(atual.getId());
        categoria.setCodigo(codigo);
        return persistir(categoria);
    }

    public void excluir(String codigo) {
        repository.delete(buscarPorCodigo(codigo));
    }

    private Categoria persistir(Categoria categoria) {
        try {
            return repository.save(categoria);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Codigo de categoria ja cadastrado", ex);
        }
    }
}

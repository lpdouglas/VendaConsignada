package com.vendaconsignada.estoque.service;

import com.vendaconsignada.estoque.model.Revendedor;
import com.vendaconsignada.estoque.repository.RevendedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RevendedorService {

    private final RevendedorRepository repository;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final ImagemLocalService imagemLocalService;

    public List<Revendedor> listar() {
        return repository.findAll();
    }

    public Revendedor buscarPorCodigo(Long codigo) {
        return repository.findByCodigoDoRevendedor(codigo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Revendedor nao encontrado"));
    }

    public Revendedor salvar(Revendedor revendedor) {
        revendedor.setId(null);
        revendedor.setCodigoDoRevendedor(proximoCodigoDisponivel());
        revendedor.setCpf(validarCpf(revendedor.getCpf(), null));
        if (revendedor.getCadastroAtivo() == null) {
            revendedor.setCadastroAtivo(true);
        }
        return persistir(revendedor);
    }

    public Revendedor atualizar(Long codigo, Revendedor revendedor) {
        Revendedor atual = buscarPorCodigo(codigo);
        revendedor.setId(atual.getId());
        revendedor.setCodigoDoRevendedor(codigo);
        revendedor.setImagemPerfil(revendedor.getImagemPerfil() == null || revendedor.getImagemPerfil().isBlank()
                ? atual.getImagemPerfil()
                : revendedor.getImagemPerfil());
        revendedor.setKitsAtivos(atual.getKitsAtivos());
        revendedor.setCpf(validarCpf(revendedor.getCpf(), atual.getCpf()));
        if (revendedor.getCadastroAtivo() == null) {
            revendedor.setCadastroAtivo(true);
        }
        return persistir(revendedor);
    }

    public Revendedor atualizarImagem(Long codigo, MultipartFile imagem) {
        Revendedor revendedor = buscarPorCodigo(codigo);
        revendedor.setImagemPerfil(imagemLocalService.armazenar("revendedores", String.valueOf(codigo), imagem));
        return repository.save(revendedor);
    }

    public void excluir(Long codigo) {
        repository.delete(buscarPorCodigo(codigo));
    }

    public void adicionarKitAtivo(Long codigoRevendedor, Long codigoKit) {
        Revendedor revendedor = buscarPorCodigo(codigoRevendedor);
        String codigo = String.valueOf(codigoKit);
        if (!revendedor.getKitsAtivos().contains(codigo)) {
            revendedor.getKitsAtivos().add(codigo);
            repository.save(revendedor);
        }
    }

    private String validarCpf(String cpf, String cpfAtual) {
        String normalizado = CpfValidator.normalize(cpf);
        if (!CpfValidator.isValid(normalizado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF invalido");
        }
        if ((cpfAtual == null || !normalizado.equals(cpfAtual)) && repository.existsByCpf(normalizado)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF ja cadastrado");
        }
        return normalizado;
    }

    private Long proximoCodigoDisponivel() {
        Long codigo = sequenceGeneratorService.next("revendedor");
        while (repository.existsByCodigoDoRevendedor(codigo)) {
            codigo = sequenceGeneratorService.next("revendedor");
        }
        return codigo;
    }

    private Revendedor persistir(Revendedor revendedor) {
        try {
            return repository.save(revendedor);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Revendedor ja cadastrado", ex);
        }
    }
}

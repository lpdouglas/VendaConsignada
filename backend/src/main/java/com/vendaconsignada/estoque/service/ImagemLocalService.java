package com.vendaconsignada.estoque.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class ImagemLocalService {

    private static final Set<String> EXTENSOES_PERMITIDAS = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private static final long MAX_IMAGE_SIZE = 2 * 1024 * 1024;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public String armazenar(String pastaRelativa, String prefixo, MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo de imagem nao informado");
        }
        if (arquivo.getSize() > MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem deve ter no maximo 2MB");
        }

        String original = StringUtils.cleanPath(arquivo.getOriginalFilename() == null ? "" : arquivo.getOriginalFilename());
        String extensao = obterExtensao(original);
        if (!EXTENSOES_PERMITIDAS.contains(extensao)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de imagem nao permitido");
        }

        try {
            Path pasta = Path.of(uploadDir, pastaRelativa).toAbsolutePath().normalize();
            Files.createDirectories(pasta);

            String nomeArquivo = prefixo + "-" + UUID.randomUUID() + "." + extensao;
            Files.copy(arquivo.getInputStream(), pasta.resolve(nomeArquivo).normalize(), StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + pastaRelativa.replace("\\", "/") + "/" + nomeArquivo;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nao foi possivel salvar a imagem", ex);
        }
    }

    private String obterExtensao(String nomeArquivo) {
        int indice = nomeArquivo.lastIndexOf('.');
        if (indice < 0 || indice == nomeArquivo.length() - 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem sem extensao valida");
        }
        return nomeArquivo.substring(indice + 1).toLowerCase();
    }
}

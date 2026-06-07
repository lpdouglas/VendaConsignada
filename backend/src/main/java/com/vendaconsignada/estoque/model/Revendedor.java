package com.vendaconsignada.estoque.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "revendedor")
public class Revendedor {

    @Id
    private String id;

    @Indexed(unique = true)
    @Field("codigo-do-revendedor")
    private Long codigoDoRevendedor;

    @NotBlank
    private String nome;

    @Field("imagem-perfil")
    private String imagemPerfil;

    @NotBlank
    private String cpf;

    @Valid
    @NotNull
    private Endereco endereco;

    @NotBlank
    private String telefone;

    @Email
    private String email;

    @Field("contatos-de-referencia")
    private String contatosDeReferencia;

    @Field("kits-ativos")
    private List<String> kitsAtivos = new ArrayList<>();

    @Field("cadastro-ativo")
    private Boolean cadastroAtivo = true;

    @NotNull
    @Field("situacao-cadastral")
    private SituacaoCadastral situacaoCadastral = SituacaoCadastral.NORMAL;
}

package com.vendaconsignada.estoque.model;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "categoria")
public class Categoria {

    @Id
    private String id;

    @NotBlank
    @Indexed(unique = true)
    private String codigo;

    @NotBlank
    private String nome;
}

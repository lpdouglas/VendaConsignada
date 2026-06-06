package com.vendaconsignada.estoque.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "kit-pre-montado")
public class KitPreMontado {

    @Id
    private String id;

    @NotBlank
    @Indexed(unique = true)
    private String codigo;

    @NotEmpty
    private List<String> produtos = new ArrayList<>();
}

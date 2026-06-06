package com.vendaconsignada.estoque.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "produto-no-estoque")
public class ProdutoNoEstoque {

    @Id
    private String id;

    @NotBlank
    @Indexed(unique = true)
    @Field("codigo-do-produto")
    @JsonAlias("codigo-do-produto")
    private String codigoDoProduto;

    @PositiveOrZero
    private long quantidade;
}

package com.vendaconsignada.estoque.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "kit-revendedor")
public class KitRevendedor {

    @Id
    private String id;

    @Indexed(unique = true)
    @Field("codigo-do-kit")
    private Long codigoDoKit;

    @NotNull
    @Field("codigo-do-revendedor")
    private Long codigoDoRevendedor;

    @NotNull
    @Field("data-de-retirada")
    private LocalDate dataDeRetirada;

    @NotNull
    @Field("data-de-acerto")
    private LocalDate dataDeAcerto;

    @Field("valor-total-de-mercadoria")
    private BigDecimal valorTotalDeMercadoria = BigDecimal.ZERO;

    @Valid
    @NotEmpty
    @Field("produtos-retirados")
    private List<ProdutoRetirado> produtosRetirados = new ArrayList<>();
}

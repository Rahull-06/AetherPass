package com.aetherpass.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoldSeatsRequest {

    @NotNull
    private Long eventId;

    @NotEmpty
    @Size(max = 10, message = "You can hold up to 10 seats at once")
    private List<Long> seatIds;
}

package com.exo.dto;

import lombok.Data;

@Data
public class UpdateUserBasicInfoDTO {
    private String realName;
    private String firstSurname;
    private String secondSurname;
    private String nick;
    private String email;
    private String genderIdentity;
    private String distinctivePhrase;
    private String description;
} 
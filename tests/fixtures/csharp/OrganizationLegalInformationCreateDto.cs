using Microsoft.AspNetCore.Http;

[TypeSharp]
public class OrganizationLegalInformationCreateDto : LegalInformationCreateDto
{
    public IFormFile ConstitutionDocument { get; set; } = default!;
    public IFormFile ProofOfRegistrationDocument { get; set; } = default!;
}

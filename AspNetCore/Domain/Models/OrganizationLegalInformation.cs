using Domain.Attributes;
using Microsoft.AspNetCore.Http;

namespace Domain.Models
{
    [TypeSharp]
    public class OrganizationLegalInformationCreateDto : LegalInformationCreateDto
    {
        public IFormFile ConstitutionDocument { get; set; }
        public IFormFile ProofOfRegistrationDocument { get; set; }
    }
}
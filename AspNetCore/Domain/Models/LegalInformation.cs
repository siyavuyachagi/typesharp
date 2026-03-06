using Domain.Attributes;

namespace Domain.Models
{
    [TypeSharp]
    public class LegalInformationCreateDto
    {
        public string RegistrationNumber { get; set; }
        public string? VatNumber { get; set; }
    }
}
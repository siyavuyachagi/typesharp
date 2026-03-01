using Domain.Attributes;

namespace Domain.Models
{
    [TypeSharp]
    public class Developer: Employee
    {
        public string Specialization { get; set; }
    }
}

using Domain.Attributes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Models
{
    [TypeSharp]
    public class Employee
    {
        public int Id { get; set; }

        [Obsolete("Use Department instead.")]
        public string? DepartmentName { get; set; }

        public string Department { get; set; }

        [Obsolete]
        public string? LegacyCode { get; set; }
    }
}

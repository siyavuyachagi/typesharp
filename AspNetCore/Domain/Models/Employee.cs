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
        public string Department { get; set; }
    }
}

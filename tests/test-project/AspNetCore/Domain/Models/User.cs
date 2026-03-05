using Domain.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Domain.Models
{
    [TypeSharp]
    [Table("Users")] // Stacked annotations
    public class User
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string Email { get; set; } = default!;
        public ICollection<UserRoleCode> Roles { get; set; } = [];
        public ICollection<string> Permissions { get; set; } = [];
        public DateTime CreatedAt { get; set; }
    }
}

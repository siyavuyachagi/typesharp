using Domain.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Domain.Models
{
    [TypeSharp]
    [Table("Users")]
    public class User
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string Email { get; set; }
        public ICollection<UserRoleCode> Roles { get; set; } = [];
        public ICollection<string> Permissions { get; set; } = [];
        public DateTime CreatedAt { get; set; }
    }
}

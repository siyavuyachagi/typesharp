using System;
using System.Collections.Generic;

[TypeSharp]
public class User
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string Email { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public ICollection<UserRoleCode> Roles { get; set; } = new List<UserRoleCode>();
    public ICollection<string> Permissions { get; set; } = new List<string>();
}

using Domain.Attributes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Models
{
    [TypeSharp]
    public enum UserRoleCode
    {
        Admin,
        User,
        Guest
    }
}

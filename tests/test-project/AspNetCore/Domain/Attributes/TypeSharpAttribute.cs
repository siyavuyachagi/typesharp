using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Enum)]
    public class TypeSharpAttribute : Attribute { }
}

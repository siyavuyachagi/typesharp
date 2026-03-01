using Domain.Attributes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Models
{
    [TypeSharp]
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T Data { get; set; }
        public List<string> Errors { get; set; }
    }
}

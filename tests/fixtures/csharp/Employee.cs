using System;

[TypeSharp]
public class Employee
{
    public int Id { get; set; }
    public string Department { get; set; } = string.Empty;

    [Obsolete("Use employeeCode instead.")]
    public string LegacyCode { get; set; } = string.Empty;
}

[TypeSharp]
public class Developer : Employee
{
    public string PrimaryLanguage { get; set; } = string.Empty;
}

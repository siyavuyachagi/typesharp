import { NamingConvention } from "./naming-convention";

/**
 * More specific naming convension configuration
 */
export type NamingConventionConfig = {
    file: NamingConvention,
    dir: NamingConvention,
}
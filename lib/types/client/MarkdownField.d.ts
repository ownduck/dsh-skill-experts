/** Controlled Markdown editor for long prompt fields (persona / skill body). */
import { type ReactNode } from 'react';
import './markdown-field.css';
export interface MarkdownFieldProps {
    readonly id: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly 'aria-label'?: string;
    readonly disabled?: boolean;
    readonly height?: number;
    readonly placeholder?: string;
}
/**
 * Markdown source editor (edit-first) with optional preview, themed for the host shell.
 * @param props - controlled field props.
 */
export declare function MarkdownField(props: MarkdownFieldProps): ReactNode;

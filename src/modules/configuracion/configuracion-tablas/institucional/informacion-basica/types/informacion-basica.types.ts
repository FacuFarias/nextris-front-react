export interface InformacionBasica {
    guid: string;
    name: string;
    mail: string;
    address: string;
    phone: string;
    logo_path?: string | null;
    require_signature_password?: boolean;
}

export type InformacionBasicaFormData = Omit<InformacionBasica, 'guid' | 'logo_path' | 'require_signature_password'> & {
    logo?: File;
    require_signature_password?: boolean;
};

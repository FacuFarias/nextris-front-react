export interface InformacionBasica {
    guid: string;
    name: string;
    mail: string;
    address: string;
    phone: string;
    logo_path?: string | null;
}

export type InformacionBasicaFormData = Omit<InformacionBasica, 'guid' | 'logo_path'> & {
    logo?: File;
};

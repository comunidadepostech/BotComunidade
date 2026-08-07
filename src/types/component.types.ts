export type LinkButtonAction = {
    type: 'link';
    label: string;
    url: string;
    disabled?: boolean;
};

export type InteractiveButtonAction = {
    type: 'button';
    customId: string;
    label: string;
    style?: 'primary' | 'secondary' | 'success' | 'danger';
    disabled?: boolean;
};

export type MessageAction = LinkButtonAction | InteractiveButtonAction;

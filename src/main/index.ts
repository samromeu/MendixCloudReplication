import { IComponent, getStudioProApi } from "@mendix/extensions-api";

export const component: IComponent = {
    async loaded(componentContext) {
        const studioPro = getStudioProApi(componentContext);
        // Add a menu item to the Extensions menu
        await studioPro.ui.extensionsMenu.add({
            menuId: "MendixCloudConnector.MainMenu",
            caption: "Mendix Cloud Connector",
            subMenus: [
                {
                    menuId: "MendixCloudConnector.ShowMenu",
                    caption: "Open Cloud Connector",
                    action: async () => {
                        await studioPro.ui.tabs.open(
                            {
                                title: "Mendix Cloud Connector"
                            },
                            {
                                componentName: "extension/MendixCloudConnector",
                                uiEntrypoint: "tab"
                                
                            }
                        )
                    }
                }
            ],
        });
    }
}


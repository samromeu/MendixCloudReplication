import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IComponent, getStudioProApi } from "@mendix/extensions-api";
import { App } from "./App";

export const component: IComponent = {
    async loaded(componentContext) {
        const studioPro = getStudioProApi(componentContext);
        let projectId: string | null = null;
        try {
            projectId = await studioPro.app.model.projects.getProjectId();
        } catch {
            projectId = null;
        }
        createRoot(document.getElementById("root")!).render(
            <StrictMode>
                <App projectId={projectId} httpProxy={studioPro.network.httpProxy} />
            </StrictMode>
        );
    }
}

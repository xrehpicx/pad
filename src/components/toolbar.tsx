import { useToast } from "@chakra-ui/react";
import { editor } from "monaco-editor";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./ui/menu";

export function ToolBar({ editor }: { editor?: editor.IStandaloneCodeEditor }) {
  const toast = useToast();
  async function handleCopy(text?: string) {
    await navigator.clipboard.writeText(`${text || window.location.href}`);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  }
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => window.open(window.location.origin)}>
            New Tab <MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          {/* <MenubarItem disabled>New Incognito Window</MenubarItem> */}
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Share</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onClick={() => handleCopy()}>
                Collaboration link
              </MenubarItem>
              <MenubarItem
                onClick={() =>
                  handleCopy(
                    `${window.location.origin}/s/${window.location.hash.replace(
                      "#",
                      ""
                    )}`
                  )
                }
              >
                Raw link
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem
            onClick={() => {
              editor?.setValue("");
              setTimeout(() => window.close());
            }}
          >
            Destroy <MenubarShortcut>⌘D</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

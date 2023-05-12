import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { VscChevronRight, VscFolderOpened, VscGist } from "react-icons/vsc";
import useStorage from "use-local-storage-state";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
// import rustpadRaw from "../rustpad-server/src/rustpad.rs?raw";
import languages from "./languages.json";
import animals from "./animals.json";
import Rustpad, { UserInfo } from "./rustpad";
import useHash from "./useHash";
import ConnectionStatus from "./ConnectionStatus";
import User from "./User";
import pastelTheme from "./themes/pastels.json";
import { ToolBar } from "./components/toolbar";
// import { initVimMode } from "monaco-vim";

function getWsUri(id: string) {
  return (
    (window.location.origin.startsWith("https") ? "wss://" : "ws://") +
    window.location.host +
    `/api/socket/${id}`
  );
}

function generateName() {
  return animals[Math.floor(Math.random() * animals.length)];
}

function generateHue() {
  return Math.floor(Math.random() * 360);
}

function App() {
  const toast = useToast();
  const [language, setLanguage] = useState("rust");
  const [connection, setConnection] = useState<
    "connected" | "disconnected" | "desynchronized"
  >("disconnected");
  const [users, setUsers] = useState<Record<number, UserInfo>>({});
  const [name, setName] = useStorage("name", generateName);
  const [hue, setHue] = useStorage("hue", generateHue);
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>();
  const darkMode = true;
  const rustpad = useRef<Rustpad>();
  const id = useHash();

  useEffect(() => {
    if (editor?.getModel()) {
      const model = editor.getModel()!;
      model.setValue("");
      model.setEOL(0); // LF
      rustpad.current = new Rustpad({
        uri: getWsUri(id),
        editor,
        onConnected: () => setConnection("connected"),
        onDisconnected: () => setConnection("disconnected"),
        onDesynchronized: () => {
          setConnection("desynchronized");
          toast({
            title: "Desynchronized with server",
            description: "Please save your work and refresh the page.",
            status: "error",
            duration: null,
          });
        },
        onChangeLanguage: (language) => {
          if (languages.includes(language)) {
            setLanguage(language);
          }
        },
        onChangeUsers: setUsers,
      });
      return () => {
        rustpad.current?.dispose();
        rustpad.current = undefined;
      };
    }
  }, [id, editor, toast, setUsers]);

  useEffect(() => {
    if (connection === "connected") {
      rustpad.current?.setInfo({ name, hue });
    }
  }, [connection, name, hue]);

  function handleChangeLanguage(language: string) {
    setLanguage(language);
    if (rustpad.current?.setLanguage(language)) {
      toast({
        title: "Language updated",
        description: (
          <>
            All users are now editing in{" "}
            <Text as="span" fontWeight="semibold">
              {language}
            </Text>
            .
          </>
        ),
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(`${window.location.origin}/#${id}`);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  }

  return (
    <div className="bg-background h-screen flex flex-col text-off-white">
      <Box
        color={darkMode ? "#cccccc" : "#383838"}
        fontSize="sm"
        py={1}
        px={2}
        className="flex relative justify-between items-center gap-1 bg-black/20 border-b border-indigo-400/20"
      >
        <div className="relative z-10">
          <ToolBar />
        </div>
        <Text>Rpad</Text>
        <div></div>
      </Box>
      <div className="flex-1 flex w-full">
        <div className="h-full w-[240px] p-2 border-r border-indigo-400/20">
          <Heading mb={1.5} size="sm">
            Language
          </Heading>
          <Select
            size="sm"
            className="border !border-indigo-400/20 !rounded-md"
            value={language}
            onChange={(event) => handleChangeLanguage(event.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang} style={{ color: "black" }}>
                {lang}
              </option>
            ))}
          </Select>

          <Heading mt={4} mb={1.5} size="sm">
            Share Link
          </Heading>
          <InputGroup size="sm">
            <Input
              readOnly
              pr="3.5rem"
              variant="outline"
              className="border !border-indigo-400/20 !rounded-md text-white/60"
              value={`${window.location.origin}/#${id}`}
            />
            <InputRightElement width="3.5rem" zIndex={0}>
              <Button
                h="1.4rem"
                size="xs"
                onClick={handleCopy}
                _hover={{ bgColor: "gray.600" }}
                bgColor={"gray.800"}
              >
                Copy
              </Button>
            </InputRightElement>
          </InputGroup>

          <Heading mt={4} mb={1.5} size="sm">
            Active Users
          </Heading>
          <Stack spacing={0} mb={1.5} fontSize="sm">
            <User
              info={{ name, hue }}
              isMe
              onChangeName={(name) => name.length > 0 && setName(name)}
              onChangeColor={() => setHue(generateHue())}
              darkMode={darkMode}
            />
            {Object.entries(users).map(([id, info]) => (
              <User key={id} info={info} darkMode={darkMode} />
            ))}
          </Stack>
        </div>
        <div className="flex-1 py-2 flex flex-col h-full">
          <HStack
            h={6}
            spacing={1}
            color="#888888"
            fontWeight="medium"
            fontSize="13px"
            px={3.5}
            flexShrink={0}
          >
            <Icon as={VscFolderOpened} fontSize="md" color="blue.500" />
            <Text>documents</Text>
            <Icon as={VscChevronRight} fontSize="md" />
            <Icon as={VscGist} fontSize="md" color="purple.500" />
            <Text>{id}</Text>
          </HStack>
          <div className="flex-1">
            <Editor
              width={"100%"}
              theme={darkMode ? "pastel" : "vs"}
              language={language}
              options={{
                automaticLayout: true,
                fontSize: 13,
                cursorStyle: "block",
                formatOnPaste: true,
                formatOnType: true,
                // autoIndent: "full"
                cursorSmoothCaretAnimation: true,
              }}
              beforeMount={(mon) =>
                mon.editor.defineTheme("pastel", pastelTheme as any)
              }
              onMount={(editor) => {
                editor.getAction("editor.action.formatDocument").run();
                setEditor(editor);
                // initVimMode(editor, document.getElementById("my-statusbar"));
              }}
            />
          </div>
        </div>
      </div>
      <div className="border-t border-indigo-800 bg-glass-gradient">
        <div className="flex gap-1 px-1 items-center bg-indigo-800 w-fit pr-2">
          <ConnectionStatus darkMode={darkMode} connection={connection} />
        </div>
      </div>
    </div>
  );
}

export default App;

import ChatInterface from '../terminal/chat_interface';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>ULTIMA - AI Platform</title>
        <meta name="description" content="Advanced AI Platform with Self-Referencing Capabilities" />
      </Head>
      <ChatInterface />
    </>
  );
}


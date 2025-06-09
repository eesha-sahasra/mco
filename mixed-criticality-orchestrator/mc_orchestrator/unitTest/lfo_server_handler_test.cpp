#include <src/lfo_server_handler.cpp>
#include <gtest/gtest.h>

TEST(ServerHandlerTests, TestInit)
{
    ServerHandler& serverHandler = ServerHandler::GetInstance();
    const auto expected = true;
    const auto actual = serverHandler.Init();
    ASSERT_EQ(expected, actual);
}

int main(int argc, char** argv)
{
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}